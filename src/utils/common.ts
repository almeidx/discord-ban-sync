/* eslint-disable @typescript-eslint/prefer-literal-enum-member */

import { env } from "node:process";
import { DiscordAPIError, type User } from "discord.js";
import { DEFAULT_DELETE_MESSAGE_DAYS, ELLIPSIS_CHAR } from "./constants.js";

export enum Time {
	Second = 1_000,
	Minute = Second * 1_000,
	Hour = Minute * 60,
	Day = Hour * 24,
}

export function makeUserInfo(user: User): string {
	return `${user.tag} (${user.id})`;
}

export function ellipsis(str: string, start: number, maxLength: number): string {
	const end = str.length > maxLength ? maxLength - ELLIPSIS_CHAR.length : maxLength;
	if (end <= 0) return ELLIPSIS_CHAR;
	return `${str.slice(start, end)}${str.length > maxLength ? ELLIPSIS_CHAR : ""}`;
}

export function parseDeleteMessageDays(): number {
	if (!env.DELETE_MESSAGE_DAYS) return DEFAULT_DELETE_MESSAGE_DAYS;

	const days = Number.parseInt(env.DELETE_MESSAGE_DAYS, 10);
	if (Number.isNaN(days)) return DEFAULT_DELETE_MESSAGE_DAYS;

	return Math.max(0, Math.min(7, days));
}

export function isDiscordAPIError(error: unknown): error is DiscordAPIError {
	return error instanceof DiscordAPIError;
}
