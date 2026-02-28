import { type Client, GatewayDispatchEvents } from "@discordjs/core";
import type { BanQueue } from "#structures/banQueue.ts";
import { getGuildIdentifier, makeUserInfo } from "#utils/common.ts";
import { isGuildEnabled } from "#utils/env.ts";
import { info } from "#utils/logger.ts";
import { addRecentBan, consumeBackfillBan, recentlyBanned } from "#utils/recentBans.ts";

export function registerGuildBanAddListener(client: Client, banQueue: BanQueue) {
	client.on(GatewayDispatchEvents.GuildBanAdd, async ({ api, data }) => {
		if (
			!isGuildEnabled(data.guild_id) ||
			consumeBackfillBan(data.guild_id, data.user.id) ||
			recentlyBanned(data.user.id)
		) {
			return;
		}

		addRecentBan(data.user.id);

		info(`${getGuildIdentifier(data.guild_id)}: ${makeUserInfo(data.user)} banned`);

		const banInfo = await api.guilds.getMemberBan(data.guild_id, data.user.id).catch(() => null);

		banQueue.queueBan(data.guild_id, data.user.id, banInfo?.reason);
	});
}
