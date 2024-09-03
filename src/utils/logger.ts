import { styleText } from "node:util";

const logPrefix = "LOG";
const errorPrefix = styleText("red", "ERROR");
const infoPrefix = styleText("cyan", "INFO");
const warnPrefix = styleText("yellow", "WARN");

export function log(message: any, ...extra: any[]) {
	console.log(prefix(message, logPrefix), ...extra);
}

export function error(message: any, ...extra: any[]) {
	console.error(prefix(message, errorPrefix), ...extra);
}

export function info(message: any, ...extra: any[]) {
	console.info(prefix(message, infoPrefix), ...extra);
}

export function warn(message: any, ...extra: any[]) {
	console.warn(prefix(message, warnPrefix), ...extra);
}

function prefix(message: any, type: string) {
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
