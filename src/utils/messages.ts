import type { Snowflake } from "discord.js";

export const MESSAGES = {
	BAN_REASON: (guildName: string, reason: string): string => `Banned from ${guildName} for: ${reason}`,
	BAN_NO_REASON: (guildName: string): string => `Banned from ${guildName}`,

	ENV_VAR_MISSING: (envVar: string): string => `Required environment variable '${envVar}' is not set`,

	GUILD_NOT_FOUND: (userId: Snowflake, guildId: Snowflake): string =>
		`Tried to action '${userId}' in '${guildId}', but the guild was not found`,

	MAX_NON_MEMBER_BANS_REACHED: "The maximum number of non-member bans has been reached",

	READY: (username: string): string => `Logged in as ${username}`,

	UNBAN_REASON: (guildName: string, reason: string): string => `Unbanned from ${guildName} for: ${reason}`,
	UNBAN_NO_REASON: (guildName: string): string => `Unbanned from ${guildName}`,

	USER_BANNED: (guildName: string, userInfo: string): string => `${guildName}: ${userInfo} banned`,
	USER_UNBANNED: (guildName: string, userInfo: string): string => `${guildName}: ${userInfo} unbanned`,
};
