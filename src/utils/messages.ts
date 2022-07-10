import type { Snowflake } from 'discord.js';

export const MESSAGES = {
  ENV_VAR_MISSING: (envVar: string): string => `Required environment variable '${envVar}' is not set`,
  GUILD_NOT_FOUND: (userId: Snowflake, guildId: Snowflake): string =>
    `Tried to action '${userId}' in '${guildId}', but the guild was not found`,
  READY: (username: string): string => `Logged in as ${username}`,
  USER_BANNED: (guildName: string, userInfo: string): string => `${guildName}: ${userInfo} banned`,
  USER_UNBANNED: (guildName: string, userInfo: string): string => `${guildName}: ${userInfo} unbanned`,
};
