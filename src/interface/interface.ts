import { Logger, LogLevel, LogFunction, LogContext } from './interface.types';

type BaseLogger = Record<LogLevel, LogFunction>;

export const createLogger = (
  baseLogger: BaseLogger,
  serviceName: string,
  env: string,
  branch?: string
): Logger => {
  const logContext: LogContext = {
    ddtags: '',
    scope: ['Main']
  };

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

    branch: ({ scope }: { scope: string }): Logger =>
      createLogger(baseLogger, serviceName, env, scope),

    setTraceContext: (traceContext) => {
      logContext.traceContext = traceContext;
    },

    addAdditionalTraceContext: (key, value) => {
      logContext.traceContext ??= {};
      logContext.traceContext[key] = value;
    },

    setInstigator: (instigator) => {
      logContext.instigator = instigator;
    },

    addDdtags: (tags) => {
      // Ensure tags is an array, even if a single string is provided
      const newTags = Array.isArray(tags) ? tags : [tags];

      // Validate tags: key must be alphanumeric with optional "_", "-", or ".", and value allows multiple colons
      const validTags = newTags.filter((tag) => /^[a-zA-Z0-9_.-]+:.+$/.test(tag));

      if (validTags.length === 0) {
        return;
      }

      // Ensure base ddtags with service and env
      logContext.ddtags = `service:${serviceName},env:${env}`;

      // Append valid tags
      logContext.ddtags += `,${validTags.join(',')}`;
    },

    addMetadata: (key, value) => {
      logContext.metadata ??= {};
      logContext.metadata[key] = value;
    },

    getCurrentLogContext: () => ({
      traceContext: { ...logContext.traceContext },
      metadata: { ...logContext.metadata },
      ddtags: logContext.ddtags,
      scope: logContext.scope
    })
  };
};
