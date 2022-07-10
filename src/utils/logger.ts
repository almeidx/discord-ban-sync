import pino from 'pino';
import type { PrettyOptions } from 'pino-pretty';

const options: PrettyOptions = {
  translateTime: 'yyyy-mm-dd HH:MM:ss',
  ignore: 'pid,hostname',
};

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options,
  },
});

const error = logger.error.bind(logger);
const fatal = logger.fatal.bind(logger);
const info = logger.info.bind(logger);
const warn = logger.warn.bind(logger);

export { error, fatal, info, warn };
