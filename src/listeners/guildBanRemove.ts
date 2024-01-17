import { AuditLogEvent, type Client, GatewayDispatchEvents } from "@discordjs/core";
import type { BanQueue } from "#structures/banQueue.js";
import { getGuildIdentifier, makeUserInfo } from "#utils/common.js";
import { GUILD_IDS } from "#utils/env.js";
import { info } from "#utils/logger.js";
import { USER_UNBANNED } from "#utils/messages.js";
import { addRecentUnban, recentlyUnbanned } from "#utils/recentBans.js";

export function registerGuildBanRemoveListener(client: Client, banQueue: BanQueue) {
	client.on(GatewayDispatchEvents.GuildBanRemove, async ({ api, data }) => {
		if (!GUILD_IDS.includes(data.guild_id) || recentlyUnbanned(data.user.id)) return;

		addRecentUnban(data.user.id);

		info(USER_UNBANNED(getGuildIdentifier(data.guild_id), makeUserInfo(data.user)));

		const logs = await api.guilds.getAuditLogs(data.guild_id, {
			action_type: AuditLogEvent.MemberBanRemove,
			limit: 3,
		});

		const entry = logs.audit_log_entries.find((entry) => entry.target_id === data.user.id);

		banQueue.queueUnban(data.guild_id, data.user.id, entry?.reason);
	});
}
