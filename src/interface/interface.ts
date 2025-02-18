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

export interface LoggerOptions {
  env: 'test' | 'staging' | 'production';
  level?: LogLevel;
  serviceName: string;
  hostname?: string;
  lightMode?: boolean;
  localMode?: boolean;
  newLineEOL?: boolean;
  datadog?: {
    apiKey: string;
    traceURL?: string;
  };
}

export type CreateLogger = (options: LoggerOptions, parentContext?: LogContext) => Logger;
