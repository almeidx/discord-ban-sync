import assert from "node:assert";
import { env } from "node:process";

assert(typeof env.DISCORD_TOKEN === "string", "DISCORD_TOKEN must be set");
assert(typeof env.GUILD_IDS === "string", "GUILD_IDS must be set");
assert(
	typeof env.DELETE_MESSAGE_SECONDS === "string" || typeof env.DELETE_MESSAGE_DAYS === "string",
	"DELETE_MESSAGE_SECONDS must be set",
);

export const DISCORD_TOKEN = env.DISCORD_TOKEN;

export const GUILD_IDS = env.GUILD_IDS.replaceAll(" ", "").split(",");

export const DELETE_MESSAGE_SECONDS = Number(
	env.DELETE_MESSAGE_SECONDS ?? (env.DELETE_MESSAGE_DAYS && Number(env.DELETE_MESSAGE_DAYS) * 24 * 60 * 60),
);

assert(
	!Number.isNaN(DELETE_MESSAGE_SECONDS) &&
		DELETE_MESSAGE_SECONDS <= 604_800 && // 7 days
		DELETE_MESSAGE_SECONDS >= 0,
	"DELETE_MESSAGE_SECONDS must be less than or equal to 604800 (7 days)",
);
