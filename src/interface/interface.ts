import { LogFunction, LogContext, TraceContext, Instigator, LogLevel } from './interface.types';

export interface Logger {
  log: LogFunction;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
  fatal: LogFunction;
  debug: LogFunction;
  trace: LogFunction;

  branch: (branchOptions: { scope: string }) => Logger;

  setTraceContext: ({ genesis, tracehistory, traceparent }: TraceContext) => void;
  addAdditionalTraceContext: (key: string, value: any) => void;
  setInstigator: ({ email, id, role }: Instigator) => void;
  addDdtags: (tags: string | string[]) => void;
  addMetadata: (key: string, value: any) => void;
  getCurrentLogContext: () => LogContext;
}

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

export type CreateLoggerOptionsMap = {
  pino: {
    logger: 'pino';
  } & LoggerOptionsType;
  winston: {
    logger: 'winston';
    lightMode?: boolean;
    newLineEOL?: boolean;
  } & LoggerOptionsType;
};

export type CreateLoggerOptions<T extends keyof CreateLoggerOptionsMap> = CreateLoggerOptionsMap[T];

export type CreateLogger = <T extends keyof CreateLoggerOptionsMap>(
  options: CreateLoggerOptions<T>,
  parentContext?: LogContext
) => Logger;
