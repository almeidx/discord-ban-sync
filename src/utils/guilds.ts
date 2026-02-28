import type { Snowflake } from "@discordjs/core";

export interface GuildCacheEntry {
	id: Snowflake;
	name: string;
}

export const guilds = new Map<Snowflake, GuildCacheEntry>();
