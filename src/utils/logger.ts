import pino from "pino";
import type { PrettyOptions } from "pino-pretty";

const options: PrettyOptions = {
	translateTime: "yyyy-mm-dd HH:MM:ss",
	ignore: "pid,hostname",
};

export const logger = pino({
	transport: {
		target: "pino-pretty",
		options,
	},
});

export const error = logger.error.bind(logger);
export const fatal = logger.fatal.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
