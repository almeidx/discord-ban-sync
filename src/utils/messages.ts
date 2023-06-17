import type { Snowflake } from "discord.js";

export const BAN_REASON = (guildName: string, reason: string): string => `Banned from ${guildName} for: ${reason}`;
export const BAN_NO_REASON = (guildName: string): string => `Banned from ${guildName}`;

export const ENV_VAR_MISSING = (envVar: string): string => `Required environment variable '${envVar}' is not set`;

export const GUILD_NOT_FOUND = (userId: Snowflake, guildId: Snowflake): string =>
	`Tried to action ${userId} in ${guildId}, but the guild was not found`;

export const MAX_NON_MEMBER_BANS_REACHED = (guildName: string): string =>
	`The maximum number of non-member bans has been reached in ${guildName}`;

export const READY = (username: string): string => `Logged in as ${username}`;

export const UNBAN_REASON = (guildName: string, reason: string): string => `Unbanned from ${guildName} for: ${reason}`;
export const UNBAN_NO_REASON = (guildName: string): string => `Unbanned from ${guildName}`;

export const USER_BANNED = (guildName: string, userInfo: string): string => `${guildName}: ${userInfo} banned`;
export const USER_UNBANNED = (guildName: string, userInfo: string): string => `${guildName}: ${userInfo} unbanned`;
