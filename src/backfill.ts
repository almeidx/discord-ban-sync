import { setTimeout as sleep } from "node:timers/promises";
import {
	type API,
	type APIBan,
	type Client,
	GatewayDispatchEvents,
	MessageFlags,
	PermissionFlagsBits,
	RESTJSONErrorCodes,
	type Snowflake,
} from "@discordjs/core";
import { DiscordAPIError } from "@discordjs/rest";
import ms from "pretty-ms";
import type { Command } from "./commands.ts";
import { GUILD_IDS } from "./config.ts";
import { guildName } from "./guilds.ts";
import { error, info, warn } from "./logger.ts";
import { performOwnAction } from "./ownActions.ts";

const BAN_PAGE_SIZE = 1_000;
const FETCH_DELAY_MS = 250;
const MAX_FETCH_RETRIES = 8;
const MAX_FETCH_BACKOFF_MS = 60_000;
const BULK_BAN_CHUNK_SIZE = 200;

interface GuildProgress {
	applied: number;
	blocked: boolean;
	failed: number;
	fetchComplete: boolean;
	fetchedBans: number;
	toApply: number;
}

interface BackfillRun {
	completedAt: number | null;
	excludedUnbans: number;
	guilds: Map<Snowflake, GuildProgress>;
	phase: "applying" | "computing" | "done" | "fetching";
	startedAt: number;
	unbannedDuringFetch: Set<Snowflake>;
	unionSize: number;
}

let lastRun: BackfillRun | null = null;

/** Records unbans made while bans are being fetched, so the backfill does not re-ban those users. */
export function registerBackfill(client: Client) {
	client.on(GatewayDispatchEvents.GuildBanRemove, ({ data }) => {
		if (lastRun?.phase === "fetching" && GUILD_IDS.has(data.guild_id)) {
			lastRun.unbannedDuringFetch.add(data.user.id);
		}
	});
}

export const backfillBansCommand: Command = {
	data: {
		default_member_permissions: PermissionFlagsBits.Administrator.toString(),
		description: "Starts a one-time historical ban sync across all configured guilds",
		name: "backfill-bans",
	},
	async execute(api, interaction) {
		if (lastRun && lastRun.phase !== "done") {
			await api.interactions.reply(interaction.id, interaction.token, {
				content: "A backfill is already running. Use `/backfill-status` to check progress.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const run = createRun();
		lastRun = run;
		void executeRun(api, run);

		await api.interactions.reply(interaction.id, interaction.token, {
			content: "Backfill started. Use `/backfill-status` to check progress.",
			flags: MessageFlags.Ephemeral,
		});
	},
};

export const backfillStatusCommand: Command = {
	data: {
		default_member_permissions: PermissionFlagsBits.Administrator.toString(),
		description: "Shows the current backfill progress or last run results",
		name: "backfill-status",
	},
	async execute(api, interaction) {
		await api.interactions.reply(interaction.id, interaction.token, {
			content: lastRun ? formatStatus(lastRun) : "No backfill has been run this session.",
			flags: MessageFlags.Ephemeral,
		});
	},
};

function createRun(): BackfillRun {
	const guilds = new Map<Snowflake, GuildProgress>();
	for (const guildId of GUILD_IDS) {
		guilds.set(guildId, { applied: 0, blocked: false, failed: 0, fetchComplete: false, fetchedBans: 0, toApply: 0 });
	}

	return {
		completedAt: null,
		excludedUnbans: 0,
		guilds,
		phase: "fetching",
		startedAt: Date.now(),
		unbannedDuringFetch: new Set(),
		unionSize: 0,
	};
}

function summarize(run: BackfillRun) {
	let applied = 0;
	let failed = 0;
	const blocked: Snowflake[] = [];
	for (const [guildId, progress] of run.guilds) {
		applied += progress.applied;
		failed += progress.failed;
		if (progress.blocked) blocked.push(guildId);
	}

	return { applied, blocked, failed };
}

function formatStatus(run: BackfillRun): string {
	const elapsed = ms((run.completedAt ?? Date.now()) - run.startedAt);
	const lines: string[] = [`**Phase:** ${run.phase} (${elapsed})`];

	for (const [guildId, progress] of run.guilds) {
		const name = guildName(guildId);
		const incomplete = progress.fetchComplete ? "" : " ⚠️ incomplete";

		if (run.phase === "fetching" && !progress.fetchComplete && progress.fetchedBans === 0) {
			lines.push(`${name}: pending`);
		} else if (run.phase === "fetching" && !progress.fetchComplete) {
			lines.push(`${name}: fetching… ${progress.fetchedBans.toLocaleString()} bans collected`);
		} else if (progress.blocked) {
			lines.push(
				`${name}: **blocked** at ${progress.applied.toLocaleString()}/${progress.toApply.toLocaleString()}${incomplete}`,
			);
		} else if (run.phase === "fetching" || run.phase === "computing") {
			lines.push(`${name}: ${progress.fetchedBans.toLocaleString()} bans fetched${incomplete}`);
		} else if (progress.toApply === 0) {
			lines.push(`${name}: already synced${incomplete}`);
		} else {
			const pct = Math.round((progress.applied / progress.toApply) * 100);
			lines.push(
				`${name}: ${progress.applied.toLocaleString()}/${progress.toApply.toLocaleString()} applied (${pct}%)${incomplete}`,
			);
		}
	}

	if (run.unionSize > 0) {
		lines.push(`\n**Union:** ${run.unionSize.toLocaleString()} unique users`);
	}

	if (run.excludedUnbans > 0) {
		lines.push(`**Excluded:** ${run.excludedUnbans} users unbanned during backfill`);
	}

	const { applied, blocked, failed } = summarize(run);

	if (run.phase === "done" || run.phase === "applying") {
		lines.push(`**Applied:** ${applied.toLocaleString()} | **Failed:** ${failed.toLocaleString()}`);
	}

	if (blocked.length > 0) {
		lines.push(`**Blocked guilds:** ${blocked.map((id) => guildName(id)).join(", ")}`);
	}

	return lines.join("\n");
}

async function executeRun(api: API, run: BackfillRun): Promise<void> {
	try {
		const guildBanSets = await fetchAllBans(api, run);
		const missing = computeMissing(run, guildBanSets);
		await applyMissing(api, run, missing);
	} catch (err) {
		error("[Backfill] Fatal error", err);
	} finally {
		run.phase = "done";
		run.completedAt = Date.now();

		const { applied, blocked, failed } = summarize(run);
		info(
			`[Backfill] Complete in ${ms(run.completedAt - run.startedAt)}: ${GUILD_IDS.size} guilds, ${applied.toLocaleString()} applied, ${failed.toLocaleString()} failed, ${blocked.length} blocked`,
		);
	}
}

async function fetchAllBans(api: API, run: BackfillRun): Promise<Map<Snowflake, Set<Snowflake>>> {
	const guildBanSets = new Map<Snowflake, Set<Snowflake>>();

	for (const [guildId, progress] of run.guilds) {
		const name = guildName(guildId);
		const banSet = new Set<Snowflake>();
		const guildStart = Date.now();
		let page = 1;
		let after: Snowflake | undefined;
		let fetchComplete = true;

		while (true) {
			const bans = await fetchBanPage(api, guildId, after);
			if (!bans) {
				fetchComplete = false;
				break;
			}

			for (const ban of bans) {
				banSet.add(ban.user.id);
			}

			progress.fetchedBans = banSet.size;

			info(`[Backfill] Fetching ${name}: page ${page}, ${banSet.size.toLocaleString()} bans collected`);

			if (bans.length < BAN_PAGE_SIZE) break;

			after = bans.at(-1)!.user.id;
			page++;

			await sleep(FETCH_DELAY_MS);
		}

		progress.fetchComplete = fetchComplete;
		guildBanSets.set(guildId, banSet);

		const elapsed = ms(Date.now() - guildStart);
		if (fetchComplete) {
			info(`[Backfill] ${name}: ${banSet.size.toLocaleString()} bans fetched in ${elapsed}`);
		} else {
			warn(
				`[Backfill] ${name}: fetch incomplete — ${banSet.size.toLocaleString()} bans collected before failure (${elapsed})`,
			);
		}
	}

	return guildBanSets;
}

/** A page of bans, or `null` once Discord's ban-fetch cap still holds after every retry. */
async function fetchBanPage(api: API, guildId: Snowflake, after: Snowflake | undefined): Promise<APIBan[] | null> {
	let retries = 0;
	let backoff = 1_000;

	while (true) {
		try {
			return await api.guilds.getMemberBans(guildId, { ...(after && { after }), limit: BAN_PAGE_SIZE });
		} catch (err) {
			if (
				!(err instanceof DiscordAPIError && err.code === RESTJSONErrorCodes.MaximumNumberOfBanFetchesHasBeenReached)
			) {
				throw err;
			}

			retries++;
			if (retries > MAX_FETCH_RETRIES) {
				error(`[Backfill] ${guildName(guildId)}: ban fetch cap exceeded after ${MAX_FETCH_RETRIES} retries`);
				return null;
			}

			warn(
				`[Backfill] ${guildName(guildId)}: ban fetch cap hit, retrying in ${ms(backoff)} (${retries}/${MAX_FETCH_RETRIES})`,
			);
			await sleep(backoff);
			backoff = Math.min(backoff * 2, MAX_FETCH_BACKOFF_MS);
		}
	}
}

function computeMissing(run: BackfillRun, guildBanSets: Map<Snowflake, Set<Snowflake>>): Map<Snowflake, Snowflake[]> {
	run.phase = "computing";

	const union = new Set<Snowflake>();
	for (const banSet of guildBanSets.values()) {
		for (const userId of banSet) {
			union.add(userId);
		}
	}

	info(`[Backfill] Union: ${union.size.toLocaleString()} unique users across ${guildBanSets.size} guilds`);

	let excluded = 0;
	for (const userId of run.unbannedDuringFetch) {
		if (union.delete(userId)) excluded++;
	}

	if (excluded > 0) {
		info(`[Backfill] Excluded ${excluded} users unbanned during backfill`);
	}

	run.unionSize = union.size;
	run.excludedUnbans = excluded;

	const missing = new Map<Snowflake, Snowflake[]>();

	for (const [guildId, progress] of run.guilds) {
		const existing = guildBanSets.get(guildId) ?? new Set<Snowflake>();
		const diff = [...union].filter((userId) => !existing.has(userId));

		missing.set(guildId, diff);
		progress.toApply = diff.length;

		if (diff.length > 0) {
			info(`[Backfill] ${guildName(guildId)}: ${diff.length.toLocaleString()} bans to apply`);
		} else {
			info(`[Backfill] ${guildName(guildId)}: already synced`);
		}
	}

	return missing;
}

async function applyMissing(api: API, run: BackfillRun, missing: Map<Snowflake, Snowflake[]>): Promise<void> {
	run.phase = "applying";

	for (const [guildId, userIds] of missing) {
		if (userIds.length === 0) continue;

		try {
			await applyGuildBans(api, guildId, run.guilds.get(guildId)!, userIds);
		} catch (err) {
			error(`[Backfill] ${guildName(guildId)}: unexpected error during apply, skipping guild`, err);
		}
	}
}

async function applyGuildBans(
	api: API,
	guildId: Snowflake,
	progress: GuildProgress,
	userIds: Snowflake[],
): Promise<void> {
	const name = guildName(guildId);
	const totalChunks = Math.ceil(userIds.length / BULK_BAN_CHUNK_SIZE);

	for (let i = 0; i < totalChunks; i++) {
		const chunk = userIds.slice(i * BULK_BAN_CHUNK_SIZE, (i + 1) * BULK_BAN_CHUNK_SIZE);

		try {
			const banned = await performOwnAction(guildId, chunk, "ban", async () => {
				// Historical bans must not purge messages, unlike live sync.
				const result = await api.guilds.bulkBanUsers(
					guildId,
					{ delete_message_seconds: 0, user_ids: chunk },
					{ reason: "Historical ban sync" },
				);
				// An empty 204 response means every user in the chunk was banned.
				return result instanceof ArrayBuffer ? chunk : result.banned_users;
			});

			progress.applied += banned.length;
			progress.failed += chunk.length - banned.length;
		} catch (err) {
			if (err instanceof DiscordAPIError && err.code === RESTJSONErrorCodes.FailedToBanUsers) {
				progress.failed += chunk.length;
				warn(`[Backfill] ${name}: all ${chunk.length} users failed to ban in chunk ${i + 1}/${totalChunks}`);
				continue;
			}

			if (
				err instanceof DiscordAPIError &&
				err.code === RESTJSONErrorCodes.MaximumNumberOfNonGuildMemberBansHasBeenExceeded
			) {
				warn(`[Backfill] ${name}: non-member ban cap hit at chunk ${i + 1}/${totalChunks}, skipping remaining`);
				progress.blocked = true;
				return;
			}

			throw err;
		}

		info(
			`[Backfill] ${name}: chunk ${i + 1}/${totalChunks} — ${progress.applied.toLocaleString()} banned, ${progress.failed.toLocaleString()} failed`,
		);
	}

	info(`[Backfill] ${name}: ${progress.applied.toLocaleString()}/${userIds.length.toLocaleString()} applied`);
}
