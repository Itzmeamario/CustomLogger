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
