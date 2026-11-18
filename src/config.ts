import assert from "node:assert";
import { env } from "node:process";

const MAX_DELETE_MESSAGE_SECONDS = 604_800; // Discord's limit: 7 days

assert(env.DISCORD_TOKEN, "DISCORD_TOKEN must be set");
assert(env.GUILD_IDS, "GUILD_IDS must be set");

export const DISCORD_TOKEN = env.DISCORD_TOKEN;

export const GUILD_IDS: ReadonlySet<string> = new Set(env.GUILD_IDS.split(/[,\s]+/).filter(Boolean));

// DELETE_MESSAGE_DAYS is deprecated but still honoured for existing deployments.
export const DELETE_MESSAGE_SECONDS = Number(
	env.DELETE_MESSAGE_SECONDS ?? Number(env.DELETE_MESSAGE_DAYS ?? 0) * 86_400,
);

assert(
	Number.isInteger(DELETE_MESSAGE_SECONDS) &&
		DELETE_MESSAGE_SECONDS >= 0 &&
		DELETE_MESSAGE_SECONDS <= MAX_DELETE_MESSAGE_SECONDS,
	`DELETE_MESSAGE_SECONDS must be an integer between 0 and ${MAX_DELETE_MESSAGE_SECONDS} (7 days)`,
);
