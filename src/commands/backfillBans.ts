import { setTimeout as sleep } from "node:timers/promises";
import {
	type API,
	type APIChatInputApplicationCommandGuildInteraction,
	MessageFlags,
	RESTJSONErrorCodes,
	type Snowflake,
} from "@discordjs/core";
import { DiscordAPIError } from "@discordjs/rest";
import ms from "pretty-ms";
import { getGuildIdentifier } from "#utils/common.ts";
import { GUILD_IDS } from "#utils/env.ts";
import { error, info, warn } from "#utils/logger.ts";
import {
	clearBackfillSuppressions,
	getUnbannedDuringBackfill,
	setBackfillActive,
	suppressBackfillBan,
} from "#utils/recentBans.ts";

const FETCH_DELAY_MS = 250;
const MAX_FETCH_RETRIES = 8;
const BULK_BAN_CHUNK_SIZE = 200;
const SUPPRESSION_CLEANUP_DELAY_MS = 120_000;

interface GuildBackfillProgress {
	applied: number;
	blocked: boolean;
	failed: number;
	fetchComplete: boolean;
	fetchedBans: number;
	toApply: number;
}

interface BackfillState {
	blockedGuilds: string[];
	completedAt: number | null;
	excludedUnbans: number;
	guilds: Map<Snowflake, GuildBackfillProgress>;
	phase: "applying" | "computing" | "done" | "fetching";
	startedAt: number;
	totalBanned: number;
	totalFailed: number;
	unionSize: number;
}

let state: BackfillState | null = null;
let isBackfillRunning = false;

export async function backfillBansCommandInteraction(
	api: API,
	interaction: APIChatInputApplicationCommandGuildInteraction,
): Promise<void> {
	if (isBackfillRunning) {
		await api.interactions.reply(interaction.id, interaction.token, {
			content: "A backfill is already running. Use `/backfill-status` to check progress.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await api.interactions.reply(interaction.id, interaction.token, {
		content: "Backfill started. Use `/backfill-status` to check progress.",
		flags: MessageFlags.Ephemeral,
	});

	void runBackfill(api);
}

export async function backfillStatusCommandInteraction(
	api: API,
	interaction: APIChatInputApplicationCommandGuildInteraction,
): Promise<void> {
	await api.interactions.reply(interaction.id, interaction.token, {
		content: formatStatus(),
		flags: MessageFlags.Ephemeral,
	});
}

function formatStatus(): string {
	if (!state) {
		return "No backfill has been run this session.";
	}

	const elapsed = ms((state.completedAt ?? Date.now()) - state.startedAt);
	const lines: string[] = [`**Phase:** ${state.phase} (${elapsed})`];

	for (const [guildId, progress] of state.guilds) {
		const name = getGuildIdentifier(guildId);
		const incomplete = progress.fetchComplete === false ? " ⚠️ incomplete" : "";

		if (state.phase === "fetching" && !progress.fetchComplete && progress.fetchedBans === 0) {
			lines.push(`${name}: pending`);
		} else if (state.phase === "fetching" && !progress.fetchComplete) {
			lines.push(`${name}: fetching… ${progress.fetchedBans.toLocaleString()} bans collected`);
		} else if (progress.blocked) {
			lines.push(
				`${name}: **blocked** at ${progress.applied.toLocaleString()}/${progress.toApply.toLocaleString()}${incomplete}`,
			);
		} else if (state.phase === "fetching" || state.phase === "computing") {
			lines.push(`${name}: ${progress.fetchedBans.toLocaleString()} bans fetched${incomplete}`);
		} else if (progress.toApply === 0) {
			lines.push(`${name}: already synced${incomplete}`);
		} else {
			const pct = progress.toApply > 0 ? Math.round((progress.applied / progress.toApply) * 100) : 100;
			lines.push(
				`${name}: ${progress.applied.toLocaleString()}/${progress.toApply.toLocaleString()} applied (${pct}%)${incomplete}`,
			);
		}
	}

	if (state.unionSize > 0) {
		lines.push(`\n**Union:** ${state.unionSize.toLocaleString()} unique users`);
	}

	if (state.excludedUnbans > 0) {
		lines.push(`**Excluded:** ${state.excludedUnbans} users unbanned during backfill`);
	}

	if (state.phase === "done" || state.phase === "applying") {
		let applied = 0;
		let failed = 0;
		for (const progress of state.guilds.values()) {
			applied += progress.applied;
			failed += progress.failed;
		}

		lines.push(`**Applied:** ${applied.toLocaleString()} | **Failed:** ${failed.toLocaleString()}`);
	}

	if (state.blockedGuilds.length > 0) {
		lines.push(`**Blocked guilds:** ${state.blockedGuilds.map((id) => getGuildIdentifier(id)).join(", ")}`);
	}

	return lines.join("\n");
}

async function runBackfill(api: API): Promise<void> {
	isBackfillRunning = true;

	state = {
		blockedGuilds: [],
		completedAt: null,
		excludedUnbans: 0,
		guilds: new Map(),
		phase: "fetching",
		startedAt: Date.now(),
		totalBanned: 0,
		totalFailed: 0,
		unionSize: 0,
	};

	for (const guildId of GUILD_IDS) {
		state.guilds.set(guildId, {
			applied: 0,
			blocked: false,
			failed: 0,
			fetchComplete: false,
			fetchedBans: 0,
			toApply: 0,
		});
	}

	setBackfillActive(true);

	try {
		const guildBanSets = await fetchAllBans(api);
		const missing = computeDiffs(guildBanSets);
		await applyDiffs(api, missing);
	} catch (err) {
		error("[Backfill] Fatal error", err);
	} finally {
		state.phase = "done";
		state.completedAt = Date.now();
		isBackfillRunning = false;

		const elapsed = ms(state.completedAt - state.startedAt);
		info(
			`[Backfill] Complete in ${elapsed}: ${GUILD_IDS.size} guilds, ${state.totalBanned.toLocaleString()} applied, ${state.totalFailed.toLocaleString()} failed, ${state.blockedGuilds.length} blocked`,
		);

		setTimeout(() => {
			clearBackfillSuppressions();
			setBackfillActive(false);
		}, SUPPRESSION_CLEANUP_DELAY_MS);
	}
}

async function fetchAllBans(api: API): Promise<Map<Snowflake, Set<Snowflake>>> {
	const guildBanSets = new Map<Snowflake, Set<Snowflake>>();

	for (const guildId of GUILD_IDS) {
		const guildName = getGuildIdentifier(guildId);
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

			const progress = state!.guilds.get(guildId)!;
			progress.fetchedBans = banSet.size;

			info(`[Backfill] Fetching ${guildName}: page ${page}, ${banSet.size.toLocaleString()} bans collected`);

			if (bans.length < 1_000) break;

			after = bans[bans.length - 1]!.user.id;
			page++;

			await sleep(FETCH_DELAY_MS);
		}

		const progress = state!.guilds.get(guildId)!;
		progress.fetchComplete = fetchComplete;

		guildBanSets.set(guildId, banSet);

		const elapsed = ms(Date.now() - guildStart);
		if (fetchComplete) {
			info(`[Backfill] ${guildName}: ${banSet.size.toLocaleString()} bans fetched in ${elapsed}`);
		} else {
			warn(
				`[Backfill] ${guildName}: fetch incomplete — ${banSet.size.toLocaleString()} bans collected before failure (${elapsed})`,
			);
		}
	}

	return guildBanSets;
}

async function fetchBanPage(
	api: API,
	guildId: Snowflake,
	after: Snowflake | undefined,
): Promise<Awaited<ReturnType<API["guilds"]["getMemberBans"]>> | null> {
	let retries = 0;
	let backoff = 1_000;

	while (true) {
		try {
			return await api.guilds.getMemberBans(guildId, { ...(after && { after }), limit: 1_000 });
		} catch (err) {
			if (err instanceof DiscordAPIError && err.code === RESTJSONErrorCodes.MaximumNumberOfBanFetchesHasBeenReached) {
				retries++;
				if (retries > MAX_FETCH_RETRIES) {
					error(`[Backfill] ${getGuildIdentifier(guildId)}: ban fetch cap exceeded after ${MAX_FETCH_RETRIES} retries`);
					return null;
				}

				warn(
					`[Backfill] ${getGuildIdentifier(guildId)}: ban fetch cap hit, retrying in ${ms(backoff)} (${retries}/${MAX_FETCH_RETRIES})`,
				);
				await sleep(backoff);
				backoff = Math.min(backoff * 2, 60_000);
				continue;
			}

			throw err;
		}
	}
}

function computeDiffs(guildBanSets: Map<Snowflake, Set<Snowflake>>): Map<Snowflake, Snowflake[]> {
	state!.phase = "computing";

	const union = new Set<Snowflake>();
	for (const banSet of guildBanSets.values()) {
		for (const userId of banSet) {
			union.add(userId);
		}
	}

	info(`[Backfill] Union: ${union.size.toLocaleString()} unique users across ${guildBanSets.size} guilds`);

	const unbanned = getUnbannedDuringBackfill();
	let excludedCount = 0;
	for (const userId of unbanned) {
		if (union.delete(userId)) {
			excludedCount++;
		}
	}

	if (excludedCount > 0) {
		info(`[Backfill] Excluded ${excludedCount} users unbanned during backfill`);
	}

	state!.unionSize = union.size;
	state!.excludedUnbans = excludedCount;

	const missing = new Map<Snowflake, Snowflake[]>();

	for (const guildId of GUILD_IDS) {
		const existing = guildBanSets.get(guildId) ?? new Set<Snowflake>();
		const diff: Snowflake[] = [];

		for (const userId of union) {
			if (!existing.has(userId)) {
				diff.push(userId);
			}
		}

		missing.set(guildId, diff);

		const progress = state!.guilds.get(guildId)!;
		progress.toApply = diff.length;

		const guildName = getGuildIdentifier(guildId);
		if (diff.length > 0) {
			info(`[Backfill] ${guildName}: ${diff.length.toLocaleString()} bans to apply`);
		} else {
			info(`[Backfill] ${guildName}: already synced`);
		}
	}

	return missing;
}

async function applyDiffs(api: API, missing: Map<Snowflake, Snowflake[]>): Promise<void> {
	state!.phase = "applying";

	for (const [guildId, userIds] of missing) {
		if (userIds.length === 0) continue;

		const guildName = getGuildIdentifier(guildId);

		try {
			await applyGuildDiff(api, guildId, guildName, userIds);
		} catch (err) {
			error(`[Backfill] ${guildName}: unexpected error during apply, skipping guild`, err);
		}
	}
}

async function applyGuildDiff(api: API, guildId: Snowflake, guildName: string, userIds: Snowflake[]): Promise<void> {
	const totalChunks = Math.ceil(userIds.length / BULK_BAN_CHUNK_SIZE);
	let guildApplied = 0;
	let guildFailed = 0;
	let blocked = false;

	for (let i = 0; i < totalChunks; i++) {
		const chunk = userIds.slice(i * BULK_BAN_CHUNK_SIZE, (i + 1) * BULK_BAN_CHUNK_SIZE);

		for (const userId of chunk) {
			suppressBackfillBan(guildId, userId);
		}

		try {
			const result = await api.guilds.bulkBanUsers(
				guildId,
				{ delete_message_seconds: 0, user_ids: chunk },
				{ reason: "Historical ban sync" },
			);

			if (result instanceof ArrayBuffer) {
				guildApplied += chunk.length;
			} else {
				guildApplied += result.banned_users.length;
				guildFailed += result.failed_users.length;
			}
		} catch (err) {
			if (err instanceof DiscordAPIError) {
				if (err.code === RESTJSONErrorCodes.FailedToBanUsers) {
					guildFailed += chunk.length;
					warn(`[Backfill] ${guildName}: all ${chunk.length} users failed to ban in chunk ${i + 1}/${totalChunks}`);
					continue;
				}

				if (err.code === RESTJSONErrorCodes.MaximumNumberOfNonGuildMemberBansHasBeenExceeded) {
					warn(`[Backfill] ${guildName}: non-member ban cap hit at chunk ${i + 1}/${totalChunks}, skipping remaining`);
					blocked = true;

					const progress = state!.guilds.get(guildId)!;
					progress.blocked = true;
					state!.blockedGuilds.push(guildId);
					break;
				}
			}

			throw err;
		}

		const progress = state!.guilds.get(guildId)!;
		progress.applied = guildApplied;
		progress.failed = guildFailed;

		info(
			`[Backfill] ${guildName}: chunk ${i + 1}/${totalChunks} — ${guildApplied.toLocaleString()} banned, ${guildFailed.toLocaleString()} failed`,
		);
	}

	state!.totalBanned += guildApplied;
	state!.totalFailed += guildFailed;

	if (!blocked) {
		info(`[Backfill] ${guildName}: ${guildApplied.toLocaleString()}/${userIds.length.toLocaleString()} applied`);
	}
}
