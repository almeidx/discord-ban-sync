import type { Snowflake } from "@discordjs/core";

export interface GuildCacheEntry {
	id: Snowflake;
	name: string;
}

export const guilds = new Map<Snowflake, GuildCacheEntry>();

let botUserId: Snowflake | null = null;

export function getBotUserId(): Snowflake | null {
	return botUserId;
}

export function setBotUserId(id: Snowflake): void {
	botUserId = id;
}
