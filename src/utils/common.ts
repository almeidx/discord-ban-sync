import type { APIUser, Snowflake } from "@discordjs/core";
import { guilds } from "#utils/guilds.ts";

export const Time = {
	Day: 1_000 * 60 * 60 * 24,
	Hour: 1_000 * 60 * 60,
	Minute: 1_000 * 60,
	Second: 1_000,
} as const;

export type Time = (typeof Time)[keyof typeof Time];

/**
 * Returns a string representation of a user's information.
 *
 * @param user - The user object containing the discriminator, id, and username
 * @returns A string in the format of "username#discriminator (id)"
 * or "\@username (id)" if the user is on the new username system
 */
export function makeUserInfo(user: Pick<APIUser, "discriminator" | "id" | "username">): string {
	const userTag = user.discriminator === "0" ? `@${user.username}` : `${user.username}#${user.discriminator}`;
	return `${userTag} (${user.id})`;
}

/**
 * Returns a string with ellipsis if it exceeds the maximum length.
 *
 * @param str - The string to truncate
 * @param start - The starting index to truncate from
 * @param maxLength - The maximum length of the truncated string
 */
export function ellipsis(str: string, start: number, maxLength: number): string {
	const end = str.length > maxLength ? maxLength - 1 : maxLength;
	if (end <= 0) return "…";
	return `${str.slice(start, end)}${str.length > maxLength ? "…" : ""}`;
}

/**
 * Converts a Discord snowflake id to a Unix timestamp in milliseconds.
 *
 * @param snowflake - The Discord snowflake id to convert
 */
export function getTimestampFromSnowflake(snowflake: Snowflake): number {
	return Number(BigInt(snowflake) / 4_194_304n + 1_420_070_400_000n);
}

/**
 * Returns the guild name if the guild is cached, otherwise returns the guild id.
 *
 * @param guildId - The guild id to get the identifier for
 */
export function getGuildIdentifier(guildId: Snowflake) {
	return guilds.get(guildId) ?? guildId;
}
