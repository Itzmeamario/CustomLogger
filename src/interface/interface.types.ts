import { LEVEL, MESSAGE, SPLAT } from 'triple-beam';

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'fatal' | 'debug' | 'trace' | 'silly';

// Include Winston internal symbols
type WinstonMeta = {
  [LEVEL]?: string;
  [MESSAGE]?: unknown;
  [SPLAT]?: unknown;
};

// Combine both types
export type ExtendedLog = Log & WinstonMeta & Record<string | symbol, unknown>;

export type LogFunction = (
  message: string | Record<string, any>,
  meta?: Record<string, any>
) => void;

export type TraceContext = {
  genesis?: string;
  tracehistory?: string;
  traceparent?: string;
} & Record<string, any>;

export type Instigator = {
  email: string;
  id: string;
  role?: string;
};

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

export type Log = {
  level: string;
  service: string;
  context: string;
  timestamp: string;
  logInfo?: Record<string, any> | Record<string, any>[];
  error?: Error | string | Record<string, any>;
  [key: string]: any;
} & LogContext;

export interface LogContext {
  metadata?: Record<string, any>;
  traceContext?: TraceContext;
  instigator?: Instigator;
  scope: string[];
  ddtags: string;
}

export type CreateLogger = (options: LoggerOptions, parentContext?: LogContext) => Logger;
