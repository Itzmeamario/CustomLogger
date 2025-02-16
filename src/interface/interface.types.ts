import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'fatal' | 'debug' | 'trace' | 'silly';

export type MetaType = Record<string, any> & {
  header: string;
  log: {
    message: string;
    logInfo?: Record<string, any> | Record<string, any>[];
    error?: Error | string | Record<string, any>;
  };
};

// Include Winston internal symbols
type WinstonMeta = {
  [LEVEL]?: string;
  [MESSAGE]?: unknown;
  [SPLAT]?: unknown;
};

// Combine both types
export type ExtendedMetaType = MetaType & WinstonMeta & Record<string | symbol, unknown>;

export type LogFunction = (
  message: string | Record<string, any>,
  meta?: Record<string, any>
) => void;

export interface Logger {
  log: LogFunction;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
  fatal: LogFunction;
  debug: LogFunction;
  trace: LogFunction;

  branch: (branchOptions: { context: string }) => Logger;

  setTraceId: (key: string, value: string) => void;
  removeTraceId: (key: string) => void;
  setDdtags: (tags: string) => void;
  addExtraMetadata: (key: string, value: any) => void;
  removeExtraMetadata: (key: string) => void;
  getCurrentLogContext: () => LogContext;
}

export interface LoggerOptions {
  env: 'test' | 'staging' | 'production';
  level?: LogLevel;
  serviceName: string;
  enableDatadog?: boolean;
  ddApiKey?: string;
  hostname?: string;
  lightMode?: boolean;
  localMode?: boolean;
  newLineEOL?: boolean;
}

export interface LogContext {
  traceIds: Record<string, string>;
  ddtags: string;
  extraMetadata: Record<string, any>;
  prefix: string[];
}

export type CreateLogger = (options: LoggerOptions, parentContext?: LogContext) => Logger;
