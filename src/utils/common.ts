import { env } from 'node:process';
import type { Snowflake, User } from 'discord.js';
import { DEFAULT_DELETE_MESSAGE_DAYS, ELLIPSIS_CHAR } from './constants.js';

export function makeUserInfo(user: User): string {
  return `${user.tag} (${user.id})`;
}

export function removeGuildIdFromArray(array: Snowflake[], item: Snowflake): Snowflake[] {
  const index = array.indexOf(item);
  if (index === -1) return array;
  array.splice(index, 1);
  return array;
}

export function ellipsis(str: string, start: number, maxLength: number): string {
  const end = str.length > maxLength ? maxLength - ELLIPSIS_CHAR.length : maxLength;
  if (end <= 0) return ELLIPSIS_CHAR;
  return `${str.slice(start, end)}${str.length > maxLength ? ELLIPSIS_CHAR : ''}`;
}

export function parseDeleteMessageDays(): number {
  if (!env.DELETE_MESSAGE_DAYS) return DEFAULT_DELETE_MESSAGE_DAYS;

  const days = parseInt(env.DELETE_MESSAGE_DAYS, 10);
  if (Number.isNaN(days)) return DEFAULT_DELETE_MESSAGE_DAYS;

  return Math.max(0, Math.min(7, days));
}
