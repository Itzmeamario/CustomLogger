import { createPinoLogger } from '../loggers/pinoLogger';
import { createWinstonLogger } from '../loggers/winstonLogger';
import { CustomLogger, CustomLoggerOptionsMap, CustomLoggerOptions } from './customLogger.types';

export const CustomLoggerMaker: CustomLogger = <T extends keyof CustomLoggerOptionsMap>(
  options: CustomLoggerOptions<T>
) => {
  const { logger, env = 'staging', ...args } = options;
  if (logger === 'pino')
    return createPinoLogger({
      env,
      ...args
    });
  return createWinstonLogger({
    env,
    ...args
  });
};
