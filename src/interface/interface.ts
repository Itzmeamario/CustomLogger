import { Logger, LogLevel, LogFunction } from './interface.types';

type BaseLogger = Record<LogLevel, LogFunction>;

export const createLogger = (
  baseLogger: BaseLogger,
  serviceName: string,
  env: string,
  branch?: string
): Logger => {
  let traceIds: Record<string, string> = {};
  let extraMetadata: Record<string, any> = {};
  let ddtags = '';

  const formatMessage = () => `[${serviceName}][${env}]${branch ? `[${branch}]` : ''}`;

  const log =
    (level: LogLevel) =>
    (message: string | Record<string, any>, meta: Record<string, any> = {}) => {
      baseLogger[level](formatMessage(), {
        level,
        message,
        ...meta
      });
    };

  return {
    log: log('log'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    fatal: log('fatal'),
    debug: log('debug'),
    trace: log('trace'),

    branch: ({ context }: { context: string }): Logger =>
      createLogger(baseLogger, serviceName, env, context),

    setTraceId: (key: string, value: string) => {
      traceIds[key] = value;
    },

    removeTraceId: (key: string) => {
      delete traceIds[key];
    },

    setDdtags: (tags: string) => {
      ddtags = tags;
    },

    addExtraMetadata: (key: string, value: any) => {
      extraMetadata[key] = value;
    },

    removeExtraMetadata: (key: string) => {
      delete extraMetadata[key];
    },

    getCurrentLogContext: () => ({
      traceIds: { ...traceIds },
      extraMetadata: { ...extraMetadata },
      ddtags,
      prefix: []
    })
  };
};
