import { env, exit } from "node:process";
import type { Snowflake } from "discord.js";
import { fatal } from "./logger.js";
import { ENV_VAR_MISSING } from "./messages.js";

if (!env.GUILD_IDS) {
	fatal(ENV_VAR_MISSING("GUILD_IDS"));
	exit(1);
}

export const GUILD_IDS: Snowflake[] = env.GUILD_IDS.replaceAll(" ", "").split(",");

export const ELLIPSIS_CHAR = "…";

export const DEFAULT_DELETE_MESSAGE_DAYS = 0;
