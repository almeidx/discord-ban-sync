import type { Snowflake } from "@discordjs/core";

const recentBans = new Set<Snowflake>();
const recentUnbans = new Set<Snowflake>();

export function recentlyBanned(userId: Snowflake): boolean {
	return recentBans.has(userId);
}

export function recentlyUnbanned(userId: Snowflake): boolean {
	return recentUnbans.has(userId);
}

export function addRecentBan(userId: Snowflake): void {
	recentBans.add(userId);
}

export function addRecentUnban(userId: Snowflake): void {
	recentUnbans.add(userId);
}

export function removeRecentBan(userId: Snowflake): void {
	recentBans.delete(userId);
}

export function removeRecentUnban(userId: Snowflake): void {
	recentUnbans.delete(userId);
}
