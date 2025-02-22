import { createPinoLogger } from '../loggers/pinoLogger';
import { createWinstonLogger } from '../loggers/winstonLogger';
import { CreateLogger, CreateLoggerOptionsMap, CreateLoggerOptions } from '../interface/interface';

export const LoggerMaker: CreateLogger = <T extends keyof CreateLoggerOptionsMap>(
  options: CreateLoggerOptions<T>
) => {
  const { logger, env = 'staging' } = options;
  if (logger === 'pino') {
    const pinoOptions: CreateLoggerOptions<'pino'> = { ...options, logger: 'pino', env };
    return createPinoLogger(pinoOptions);
  }

  const winstonOptions: CreateLoggerOptions<'winston'> = { ...options, logger: 'winston', env };
  return createWinstonLogger(winstonOptions);
};
