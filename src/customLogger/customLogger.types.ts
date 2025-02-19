import { Logger } from '../interface/interface';
import { LogLevel } from '../interface/interface.types';

type BaseLoggerOptions = {
  env?: 'test' | 'staging' | 'production';
  level?: LogLevel;
  serviceName: string;
  hostname?: string;
};

type LoggerOptionsType = BaseLoggerOptions &
  (
    | {
        localMode: false;
        datadog: {
          apiKey: string;
        };
      }
    | {
        localMode: true;
      }
  );

export type CustomLoggerOptionsMap = {
  pino: {
    logger: 'pino';
  } & LoggerOptionsType;
  winston: {
    logger: 'winston';
    lightMode?: boolean;
    newLineEOL?: boolean;
  } & LoggerOptionsType;
};

export type CustomLoggerOptions<T extends keyof CustomLoggerOptionsMap> = CustomLoggerOptionsMap[T];

export type CustomLogger = <T extends keyof CustomLoggerOptionsMap>(
  options: CustomLoggerOptions<T>
) => Logger;
