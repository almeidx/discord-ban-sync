import { env } from 'node:process';
import type { Snowflake } from 'discord.js';
import { Time } from './common.js';

export const GUILD_IDS: Snowflake[] = env.GUILD_IDS!.replaceAll(' ', '').split(',');

export const RECENT_BAN_LIFETIME = 10 * Time.Minutes;

export const ELLIPSIS_CHAR = '…';

export const DEFAULT_DELETE_MESSAGE_DAYS = 0;
