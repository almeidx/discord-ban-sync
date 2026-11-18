import { styleText } from "node:util";

const errorPrefix = styleText("red", "ERROR");
const infoPrefix = styleText("cyan", "INFO");
const warnPrefix = styleText("yellow", "WARN");

export function error(message: string, ...extra: unknown[]) {
	console.error(prefix(message, errorPrefix), ...extra);
}

export function info(message: string, ...extra: unknown[]) {
	console.info(prefix(message, infoPrefix), ...extra);
}

export function warn(message: string, ...extra: unknown[]) {
	console.warn(prefix(message, warnPrefix), ...extra);
}

function prefix(message: string, type: string) {
	return `${styleText("gray", formatDate(new Date()))} [${type}] ${message}`;
}

function formatDate(date: Date) {
	const datePart = `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
	const hourPart = `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`;

	return `${datePart} ${hourPart}`;
}

function padNumber(num: number) {
	return num.toString().padStart(2, "0");
}
