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
}

export class BanQueue {
  #queueLock = false;
  readonly #queue: BanInfo[] = [];

  public constructor(public client: Client<true>) {}

  public queueBan(userId: Snowflake, guildIds: Snowflake[]): void {
    // TODO: Check if the user unban/ban is already in queue

    this.#queue.push({ guildIds, userId, type: BanType.Ban });

    void this.processQueue();
  }

  public queueUnban(userId: Snowflake, guildIds: Snowflake[]): void {
    // TODO: Check if the user unban/ban is already in queue

    this.#queue.push({ guildIds, userId, type: BanType.Unban });

    void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.#queueLock || this.#queue.length === 0) {
      return;
    }

    this.#queueLock = true;

    // This will always exist because of the length check at the beginning
    const banInfo = this.#queue.shift()!;

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

      this.#queueLock = false;
    } catch (e) {
      error(e);

      this.#queueLock = false;

      await this.processQueue();
    }
  }
}
