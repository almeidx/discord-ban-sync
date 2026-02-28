import { type API, AuditLogEvent, type Client, GatewayDispatchEvents, type Snowflake } from "@discordjs/core";
import type { BanQueue } from "#structures/banQueue.ts";
import { getGuildIdentifier, makeUserInfo } from "#utils/common.ts";
import { GUILD_IDS } from "#utils/env.ts";
import { error, info } from "#utils/logger.ts";
import { addRecentUnban, recentlyUnbanned, trackUnbanDuringBackfill } from "#utils/recentBans.ts";
import { USER_UNBANNED } from "../utils/messages.ts";

export function registerGuildBanRemoveListener(client: Client, banQueue: BanQueue) {
	client.on(GatewayDispatchEvents.GuildBanRemove, async ({ api, data }) => {
		if (!GUILD_IDS.includes(data.guild_id) || recentlyUnbanned(data.user.id)) return;

		addRecentUnban(data.user.id);
		trackUnbanDuringBackfill(data.user.id);

		info(USER_UNBANNED(getGuildIdentifier(data.guild_id), makeUserInfo(data.user)));

		const auditLogReason = await getUnbanAuditLogReason(api, data.guild_id, data.user.id);
		banQueue.queueUnban(data.guild_id, data.user.id, auditLogReason);
	});
}

async function getUnbanAuditLogReason(api: API, guildId: Snowflake, userId: Snowflake): Promise<string | null> {
	try {
		const logs = await api.guilds.getAuditLogs(guildId, {
			action_type: AuditLogEvent.MemberBanRemove,
			limit: 3,
		});

		const entry = logs?.audit_log_entries.find((entry) => entry.target_id === userId);
		return entry?.reason ?? null;
	} catch (error_) {
		error(`Failed to fetch unban audit logs for ${getGuildIdentifier(guildId)}`, error_);
		return null;
	}
}
