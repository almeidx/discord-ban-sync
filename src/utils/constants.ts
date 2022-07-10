import { env } from 'node:process';
import type { Snowflake } from 'discord.js';

export const GUILD_IDS: Snowflake[] = env.GUILD_IDS!.replaceAll(' ', '').split(',');

export const ELLIPSIS_CHAR = '…';

export const DEFAULT_DELETE_MESSAGE_DAYS = 0;
