import { type Client, GatewayDispatchEvents } from "@discordjs/core";
import type { BanQueue } from "#structures/banQueue.ts";
import { getGuildIdentifier, makeUserInfo } from "#utils/common.ts";
import { GUILD_IDS } from "#utils/env.ts";
import { info } from "#utils/logger.ts";
import { USER_BANNED } from "#utils/messages.ts";
import { addRecentBan, recentlyBanned } from "#utils/recentBans.ts";

export function registerGuildBanAddListener(client: Client, banQueue: BanQueue) {
	client.on(GatewayDispatchEvents.GuildBanAdd, async ({ api, data }) => {
		if (!GUILD_IDS.includes(data.guild_id) || recentlyBanned(data.user.id)) return;

		addRecentBan(data.user.id);

		info(USER_BANNED(getGuildIdentifier(data.guild_id), makeUserInfo(data.user)));

		const banInfo = await api.guilds.getMemberBan(data.guild_id, data.user.id).catch(() => null);

		banQueue.queueBan(data.guild_id, data.user.id, banInfo?.reason);
	});
}
