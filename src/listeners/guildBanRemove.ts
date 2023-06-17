import type { GuildBan } from "discord.js";
import type { BanQueue } from "../structures/banQueue.js";
import { makeUserInfo } from "../utils/common.js";
import { GUILD_IDS } from "../utils/constants.js";
import { info } from "../utils/logger.js";
import { USER_UNBANNED } from "../utils/messages.js";
import { addRecentUnban, recentlyUnbanned } from "../utils/recentBans.js";

export function createGuildBanRemoveListener(banQueue: BanQueue): (banInfo: GuildBan) => void {
	return function guildBanRemove(banInfo: GuildBan): void {
		if (!GUILD_IDS.includes(banInfo.guild.id) || recentlyUnbanned(banInfo.user.id)) return;

		addRecentUnban(banInfo.user.id);

		info(USER_UNBANNED(banInfo.guild.name, makeUserInfo(banInfo.user)));

		banQueue.queueUnban(banInfo);
	};
}
