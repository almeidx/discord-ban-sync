import type { Snowflake, User } from 'discord.js';

export const enum Time {
  Seconds = 1000,
  Minutes = Seconds * 60,
  Hours = Minutes * 60,
  Days = Hours * 24,
  Weeks = Days * 7,
  Years = Days * 365.24125,
  Months = Years / 12,
}

export function makeUserInfo(user: User): string {
  return `${user.tag} (${user.id})`;
}

export function removeGuildIdFromArray(array: Snowflake[], item: Snowflake): Snowflake[] {
  const index = array.indexOf(item);
  if (index === -1) return array;
  array.splice(index, 1);
  return array;
}
