import { env } from "node:process";
import type { Snowflake } from "discord.js";
import { Time } from "./common.js";

export const GUILD_IDS: Snowflake[] = env.GUILD_IDS!.replaceAll(" ", "").split(",");

export const ELLIPSIS_CHAR = "…";

export const DEFAULT_DELETE_MESSAGE_DAYS = 0;

export const SWEEPER_INTERVAL = Time.Hour;
