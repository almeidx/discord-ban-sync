import type { GuildBan } from "discord.js";
import type { BanQueue } from "../structures/banQueue.js";
import { makeUserInfo, removeGuildIdFromArray } from "../utils/common.js";
import { GUILD_IDS } from "../utils/constants.js";
import { info } from "../utils/logger.js";
import { MESSAGES } from "../utils/messages.js";
import { addRecentBan, recentlyBanned } from "../utils/recentBans.js";

export function createGuildBanAddListener(banQueue: BanQueue): (banInfo: GuildBan) => void {
	return function guildBanAdd(banInfo: GuildBan): void {
		if (!GUILD_IDS.includes(banInfo.guild.id) || recentlyBanned(banInfo.user.id)) return;

		addRecentBan(banInfo.user.id);

		banQueue.queueBan(
			banInfo.user.id,
			banInfo.reason,
			banInfo.guild.name,
			removeGuildIdFromArray(GUILD_IDS, banInfo.guild.id),
		);

		info(MESSAGES.USER_BANNED(banInfo.guild.name, makeUserInfo(banInfo.user)));
	};
}
