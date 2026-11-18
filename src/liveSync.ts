import {
	type API,
	type APIUser,
	AuditLogEvent,
	type Client,
	GatewayDispatchEvents,
	RESTJSONErrorCodes,
	type Snowflake,
} from "@discordjs/core";
import { DiscordAPIError } from "@discordjs/rest";
import { DELETE_MESSAGE_SECONDS, GUILD_IDS } from "./config.ts";
import { guildName } from "./guilds.ts";
import { error, info, warn } from "./logger.ts";
import { type BanAction, consumeOwnAction, performOwnAction } from "./ownActions.ts";

const MAX_AUDIT_LOG_REASON_LENGTH = 512;

interface SyncJob {
	action: BanAction;
	originGuildId: Snowflake;
	/** Looked up when the event arrives: the ban or its audit log entry may be gone by the time the job runs. */
	reason: Promise<string | null>;
	userId: Snowflake;
}

const queue: SyncJob[] = [];
let draining = false;

/** Mirrors every moderator ban/unban in a configured guild to all other configured guilds, one user at a time, in event order. */
export function registerLiveSync(client: Client) {
	client.on(GatewayDispatchEvents.GuildBanAdd, ({ api, data }) => {
		if (!GUILD_IDS.has(data.guild_id) || consumeOwnAction(data.guild_id, data.user.id, "ban")) return;

		info(`${guildName(data.guild_id)}: ${formatUser(data.user)} banned`);
		const reason = fetchBanReason(api, data.guild_id, data.user.id);
		enqueue(api, { action: "ban", originGuildId: data.guild_id, reason, userId: data.user.id });
	});

	client.on(GatewayDispatchEvents.GuildBanRemove, ({ api, data }) => {
		if (!GUILD_IDS.has(data.guild_id) || consumeOwnAction(data.guild_id, data.user.id, "unban")) return;

		info(`${guildName(data.guild_id)}: ${formatUser(data.user)} unbanned`);
		const reason = fetchUnbanReason(api, data.guild_id, data.user.id);
		enqueue(api, { action: "unban", originGuildId: data.guild_id, reason, userId: data.user.id });
	});
}

function enqueue(api: API, job: SyncJob) {
	queue.push(job);
	void drain(api);
}

async function drain(api: API) {
	if (draining) return;
	draining = true;

	try {
		for (let job = queue.shift(); job; job = queue.shift()) {
			await propagate(api, job);
		}
	} finally {
		draining = false;
	}
}

async function propagate(api: API, job: SyncJob) {
	const { action, originGuildId, userId } = job;
	const reason = await job.reason;
	const verb = action === "ban" ? "Banned" : "Unbanned";
	const origin = guildName(originGuildId);
	const fullReason = reason ? `${verb} from ${origin} for: ${reason}` : `${verb} from ${origin}`;
	const auditLogReason =
		fullReason.length > MAX_AUDIT_LOG_REASON_LENGTH
			? `${fullReason.slice(0, MAX_AUDIT_LOG_REASON_LENGTH - 1)}…`
			: fullReason;

	let actionsTaken = 0;

	for (const guildId of GUILD_IDS) {
		if (guildId === originGuildId) continue;

		try {
			const applied = await performOwnAction(guildId, [userId], action, async () => {
				const done =
					action === "ban"
						? await banUser(api, guildId, userId, auditLogReason)
						: await unbanUser(api, guildId, userId, auditLogReason);
				return done ? [userId] : [];
			});
			actionsTaken += applied.length;
		} catch (error_) {
			error(`Failed to ${action} ${userId} in ${guildName(guildId)}`, error_);
		}
	}

	info(`Processed ${actionsTaken} actions for ${userId}`);
}

async function banUser(api: API, guildId: Snowflake, userId: Snowflake, reason: string): Promise<boolean> {
	try {
		await api.guilds.banUser(guildId, userId, { delete_message_seconds: DELETE_MESSAGE_SECONDS }, { reason });
		return true;
	} catch (error_) {
		if (
			error_ instanceof DiscordAPIError &&
			error_.code === RESTJSONErrorCodes.MaximumNumberOfNonGuildMemberBansHasBeenExceeded
		) {
			// TODO: Disable ban queue in this guild until the day is over/after one day has passed
			warn(`The maximum number of non-member bans has been reached in ${guildName(guildId)}`);
			return false;
		}

		throw error_;
	}
}

async function unbanUser(api: API, guildId: Snowflake, userId: Snowflake, reason: string): Promise<boolean> {
	try {
		await api.guilds.unbanUser(guildId, userId, { reason });
		return true;
	} catch (error_) {
		if (error_ instanceof DiscordAPIError && error_.code === RESTJSONErrorCodes.UnknownBan) {
			return false;
		}

		throw error_;
	}
}

// GUILD_BAN_ADD carries no reason; the ban object does.
async function fetchBanReason(api: API, guildId: Snowflake, userId: Snowflake): Promise<string | null> {
	try {
		const ban = await api.guilds.getMemberBan(guildId, userId);
		return ban.reason;
	} catch (error_) {
		error(`Failed to fetch ban reason for ${userId} in ${guildName(guildId)}`, error_);
		return null;
	}
}

// Unbans keep no record except the audit log.
async function fetchUnbanReason(api: API, guildId: Snowflake, userId: Snowflake): Promise<string | null> {
	try {
		const logs = await api.guilds.getAuditLogs(guildId, {
			action_type: AuditLogEvent.MemberBanRemove,
			limit: 3,
		});

		return logs.audit_log_entries.find((entry) => entry.target_id === userId)?.reason ?? null;
	} catch (error_) {
		error(`Failed to fetch unban audit logs for ${guildName(guildId)}`, error_);
		return null;
	}
}

function formatUser(user: Pick<APIUser, "discriminator" | "id" | "username">): string {
	const userTag = user.discriminator === "0" ? `@${user.username}` : `${user.username}#${user.discriminator}`;
	return `${userTag} (${user.id})`;
}
