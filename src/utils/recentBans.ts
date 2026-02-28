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

const backfillSuppressed = new Set<string>();
const unbannedDuringBackfill = new Set<Snowflake>();
let backfillActive = false;

export function suppressBackfillBan(guildId: Snowflake, userId: Snowflake): void {
	backfillSuppressed.add(`${guildId}:${userId}`);
}

export function consumeBackfillBan(guildId: Snowflake, userId: Snowflake): boolean {
	return backfillSuppressed.delete(`${guildId}:${userId}`);
}

export function clearBackfillSuppressions(): void {
	backfillSuppressed.clear();
}

export function setBackfillActive(active: boolean): void {
	backfillActive = active;
	if (!active) {
		unbannedDuringBackfill.clear();
	}
}

export function trackUnbanDuringBackfill(userId: Snowflake): void {
	if (backfillActive) {
		unbannedDuringBackfill.add(userId);
	}
}

export function getUnbannedDuringBackfill(): ReadonlySet<Snowflake> {
	return unbannedDuringBackfill;
}
