export const BAN_REASON = (guildIdentifier: string, reason: string): string =>
	`Banned from ${guildIdentifier} for: ${reason}`;

export const BAN_NO_REASON = (guildIdentifier: string): string => `Banned from ${guildIdentifier}`;

export const ENV_VAR_MISSING = (envVar: string): string => `Required environment variable '${envVar}' is not set`;

export const MAX_NON_MEMBER_BANS_REACHED = (guildIdentifier: string): string =>
	`The maximum number of non-member bans has been reached in ${guildIdentifier}`;

export const READY = (username: string): string => `Logged in as ${username}`;

export const UNBAN_REASON = (guildIdentifier: string, reason: string): string =>
	`Unbanned from ${guildIdentifier} for: ${reason}`;

export const UNBAN_NO_REASON = (guildIdentifier: string): string => `Unbanned from ${guildIdentifier}`;

export const USER_BANNED = (guildIdentifier: string, userInfo: string): string =>
	`${guildIdentifier}: ${userInfo} banned`;

export const USER_UNBANNED = (guildIdentifier: string, userInfo: string): string =>
	`${guildIdentifier}: ${userInfo} unbanned`;
