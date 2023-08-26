import { cyan, gray, red, yellow } from "colorette";

const logPrefix = "LOG";
const errorPrefix = red("ERROR");
const infoPrefix = cyan("INFO");
const warnPrefix = yellow("WARN");

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
	return `${gray(formatDate(new Date()))} [${type}] ${message}`;
}

function formatDate(date: Date) {
	return (
		`${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())} ${
			padNumber(date.getHours())
		}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`
	);
}

function padNumber(num: number) {
	return num.toString().padStart(2, "0");
}
