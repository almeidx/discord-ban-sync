import { AuditLogEvent, type Client, GatewayDispatchEvents } from "@discordjs/core";
import type { BanQueue } from "#structures/banQueue.ts";
import { getGuildIdentifier, makeUserInfo } from "#utils/common.ts";
import { GUILD_IDS } from "#utils/env.ts";
import { info } from "#utils/logger.ts";
import { USER_UNBANNED } from "#utils/messages.ts";
import { addRecentUnban, recentlyUnbanned } from "#utils/recentBans.ts";

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
