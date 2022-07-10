import { setInterval } from 'node:timers';
import type { Snowflake } from 'discord.js';
import { Time } from './common.js';
import { RECENT_BAN_LIFETIME } from './constants.js';

const recentBans = new Map<Snowflake, number>();
const recentUnbans = new Map<Snowflake, number>();

export function recentlyBanned(userId: Snowflake): boolean {
  return recentBans.has(userId);
}

export function recentlyUnbanned(userId: Snowflake): boolean {
  return recentUnbans.has(userId);
}

export function addRecentBan(userId: Snowflake): void {
  recentBans.set(userId, Date.now());
}

export function addRecentUnban(userId: Snowflake): void {
  recentUnbans.set(userId, Date.now());
}

function clearBans(bans: Map<Snowflake, number>): void {
  const now = Date.now();
  for (const [userId, timestamp] of bans.entries()) {
    if (now - timestamp > RECENT_BAN_LIFETIME) bans.delete(userId);
  }
}

setInterval((): void => {
  clearBans(recentBans);
  clearBans(recentUnbans);
}, 1 * Time.Hours).unref();
