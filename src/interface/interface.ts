import { LogFunction, LogContext, TraceContext, Instigator, LogLevel } from './interface.types';

export type Logger = {
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
};

type BaseLoggerOptions = {
  env?: 'test' | 'staging' | 'production';
  level?: LogLevel;
  serviceName: string;
  hostname: string;
  localMode?: boolean;
};

export type LoggersName = 'pino' | 'winston';

export type CreateLoggerOptionsMap = {
  [K in LoggersName]: {
    logger: K;
  } & BaseLoggerOptions &
    (K extends 'winston'
      ? {
          lightMode?: boolean;
          newLineEOL?: boolean;
        }
      : {});
};

export type CreateLoggerOptions<T extends LoggersName> = CreateLoggerOptionsMap[T];

export type CreateLogger = <T extends LoggersName>(
  options: CreateLoggerOptions<T>,
  parentContext?: LogContext
) => Logger;
