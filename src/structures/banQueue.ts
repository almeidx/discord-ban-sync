import type { Client, Snowflake } from 'discord.js';
import { ellipsis, parseDeleteMessageDays } from '../utils/common.js';
import { error, warn } from '../utils/logger.js';
import { MESSAGES } from '../utils/messages.js';
import { removeRecentBan, removeRecentUnban } from '../utils/recentBans.js';

const enum BanType {
  Ban,
  Unban,
}

type Reason = string | null | undefined;

interface BanInfo {
  guildName: string;
  guildIds: Snowflake[];
  ignore?: true;
  reason: Reason;
  type: BanType;
  userId: Snowflake;
}

export class BanQueue {
  #queueLock = false;
  readonly #queue: BanInfo[] = [];
  private readonly deleteMessageDays: number = parseDeleteMessageDays();

  public constructor(public client: Client<true>) {}

  public queueBan(userId: Snowflake, reason: Reason, guildName: string, guildIds: Snowflake[]): void {
    // If the following method returns 1, there is a ban item for this user in the queue
    if (this.checkAndInvalidateQueueItem(userId, BanType.Unban)) return;

    this.#queue.push({ guildName, guildIds, userId, reason, type: BanType.Ban });

    void this.processQueue();
  }

  public queueUnban(userId: Snowflake, reason: Reason, guildName: string, guildIds: Snowflake[]): void {
    // If the following method returns 1, there is an unban item for this user in the queue
    if (this.checkAndInvalidateQueueItem(userId, BanType.Ban)) return;

    this.#queue.push({ guildName, guildIds, userId, reason, type: BanType.Unban });

    void this.processQueue();
  }

  /**
   * Invalidates a queue item, if it exists
   * @param userId The id of the user that is being actioned on
   * @param banType The opposite banType than the one that is being enqueued
   * @returns `1` if there is an opposite of `banType` item for this user, `0` otherwise
   */
  private checkAndInvalidateQueueItem(userId: Snowflake, banType: BanType): number {
    const existingQueueItem = this.#queue.find((info) => info.userId === userId);
    if (existingQueueItem) {
      // There is a <banType> for this user in the queue, ignore it
      if (existingQueueItem.type === banType) {
        existingQueueItem.ignore = true;
        return 0;
      }

      // There is an <opposite of banType> for this user in the queue
      return 1;
    }

    // There is no existing item for this user in the queue
    return 0;
  }

  private async processQueue(): Promise<void> {
    if (this.#queueLock || this.#queue.length === 0) {
      return;
    }

    this.#queueLock = true;

    // This will always exist because of the length check at the beginning
    const banInfo = this.#queue.shift()!;

    if (banInfo.ignore) {
      this.#queueLock = false;
      return void this.processQueue();
    }

    try {
      for (const guildId of banInfo.guildIds) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) {
          warn(MESSAGES.GUILD_NOT_FOUND(banInfo.userId, guildId));
          continue;
        }

        if (banInfo.type === BanType.Ban) {
          await guild.bans.create(banInfo.userId, {
            deleteMessageDays: this.deleteMessageDays,
            reason: this.resolveReason(BanType.Ban, guild.name, banInfo.reason),
          });
        } else {
          await guild.bans.remove(banInfo.userId, this.resolveReason(BanType.Unban, guild.name, banInfo.reason));
        }
      }
    } catch (e) {
      // TODO: Handle 30035

      error(e);
    } finally {
      if (banInfo.type === BanType.Ban) {
        removeRecentBan(banInfo.userId);
      } else {
        removeRecentUnban(banInfo.userId);
      }

      this.#queueLock = false;

      void this.processQueue();
    }
  }

  private resolveReason(type: BanType, guildName: string, reason: Reason): string {
    let msg: string;

    if (type === BanType.Ban) {
      if (reason) msg = MESSAGES.BAN_REASON(guildName, reason);
      else msg = MESSAGES.BAN_NO_REASON(guildName);
    } else if (reason) msg = MESSAGES.UNBAN_REASON(guildName, reason);
    else msg = MESSAGES.UNBAN_NO_REASON(guildName);

    return ellipsis(msg, 0, 512);
  }
}
