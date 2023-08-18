import { env } from "node:process";

if (typeof env.DISCORD_TOKEN !== "string") {
	throw new TypeError("DISCORD_TOKEN must be set");
}

if (typeof env.GUILD_IDS !== "string") {
	throw new TypeError("GUILD_IDS must be set");
}

if (typeof env.DELETE_MESSAGE_SECONDS !== "string" && typeof env.DELETE_MESSAGE_DAYS !== "string") {
	throw new TypeError("DELETE_MESSAGE_SECONDS must be set");
}

export const DISCORD_TOKEN = env.DISCORD_TOKEN;

export const GUILD_IDS = env.GUILD_IDS.replaceAll(" ", "").split(",");

export const DELETE_MESSAGE_SECONDS = Number(
	env.DELETE_MESSAGE_SECONDS ?? (env.DELETE_MESSAGE_DAYS && Number(env.DELETE_MESSAGE_DAYS) * 24 * 60 * 60),
);

if (
	Number.isNaN(DELETE_MESSAGE_SECONDS)
	|| DELETE_MESSAGE_SECONDS > 604_800 // 7 days
	|| DELETE_MESSAGE_SECONDS < 0
) {
	throw new TypeError("DELETE_MESSAGE_SECONDS must be less than or equal to 7 days");
}
