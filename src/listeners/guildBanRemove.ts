import type { GuildBan } from 'discord.js';
import type { BanQueue } from '../structures/banQueue.js';
import { makeUserInfo, removeGuildIdFromArray } from '../utils/common.js';
import { GUILD_IDS } from '../utils/constants.js';
import { info } from '../utils/logger.js';
import { MESSAGES } from '../utils/messages.js';
import { addRecentUnban, recentlyUnbanned } from '../utils/recentBans.js';

export function createGuildBanRemoveListener(banQueue: BanQueue): (banInfo: GuildBan) => void {
  return function guildBanRemove(banInfo: GuildBan): void {
    if (recentlyUnbanned(banInfo.user.id)) return;

    addRecentUnban(banInfo.user.id);

    banQueue.queueUnban(
      banInfo.user.id,
      banInfo.reason,
      banInfo.guild.name,
      removeGuildIdFromArray(GUILD_IDS, banInfo.guild.id),
    );

    info(MESSAGES.USER_UNBANNED(banInfo.guild.name, makeUserInfo(banInfo.user)));
  };
}
