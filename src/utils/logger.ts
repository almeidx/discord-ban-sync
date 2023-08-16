import pino from "pino";
import type { PrettyOptions } from "pino-pretty";

export const logger = pino({
	transport: {
		target: "pino-pretty",
		options: {
			translateTime: "yyyy-mm-dd HH:MM:ss",
			ignore: "pid,hostname",
		} satisfies PrettyOptions,
	},
});

export const error = logger.error.bind(logger);
export const fatal = logger.fatal.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
