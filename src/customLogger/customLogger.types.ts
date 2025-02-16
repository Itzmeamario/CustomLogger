import { LoggerOptions } from 'pino';

export interface LogContext {
  traceIds: Record<string, string>;
  ddtags: string;
  extraMetadata: Record<string, any>;
  prefix: string[];
}

export type CustomOptions = Omit<LoggerOptions, 'timestamp' | 'formatters' | 'transport'> & {
  serviceName: string;
  env: 'test' | 'staging' | 'production';
  hostname?: string;
  enableDatadog?: boolean;
  ddApiKey?: string;
};

export interface CustomLogger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  fatal: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  trace: (...args: any[]) => void;
  branch: (branchOptions: { context: string }) => CustomLogger;

  // Functions to manipulate log context
  setTraceId: (key: string, value: string) => void;
  removeTraceId: (key: string) => void;
  setDdtags: (tags: string) => void;
  addExtraMetadata: (key: string, value: any) => void;
  removeExtraMetadata: (key: string) => void;
  getCurrentLogContext: () => LogContext;
}

// Define the type for the `createLogger` function
export type CreateLogger = (
  customOptions: CustomOptions,
  parentContext?: LogContext
) => CustomLogger;
