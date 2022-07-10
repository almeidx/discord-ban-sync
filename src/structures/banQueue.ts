import type { Client, Snowflake } from 'discord.js';
import { error, warn } from '../utils/logger.js';
import { MESSAGES } from '../utils/messages.js';

const enum BanType {
  Ban,
  Unban,
}

interface BanInfo {
  userId: Snowflake;
  guildIds: Snowflake[];
  type: BanType;
  ignore?: true;
}

export class BanQueue {
  #queueLock = false;
  readonly #queue: BanInfo[] = [];

  public constructor(public client: Client<true>) {}

  public queueBan(userId: Snowflake, guildIds: Snowflake[]): void {
    // If the following method returns 1, there is a ban item for this user in the queue
    if (this.checkAndInvalidateQueueItem(userId, BanType.Unban)) return;

    this.#queue.push({ guildIds, userId, type: BanType.Ban });

    void this.processQueue();
  }

  public queueUnban(userId: Snowflake, guildIds: Snowflake[]): void {
    // If the following method returns 1, there is an unban item for this user in the queue
    if (this.checkAndInvalidateQueueItem(userId, BanType.Ban)) return;

    this.#queue.push({ guildIds, userId, type: BanType.Unban });

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
          await guild.bans.create(banInfo.userId, { reason: 'BanQueue' });
        } else {
          await guild.bans.remove(banInfo.userId, 'BanQueue');
        }
      }
    } catch (e) {
      // TODO: Handle 30035

      error(e);
    } finally {
      this.#queueLock = false;

      void this.processQueue();
    }
  }
}
