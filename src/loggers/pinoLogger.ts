import pino, { StreamEntry } from 'pino';
import { PinoPretty } from 'pino-pretty';
import 'pino-datadog-transport';

import { CreateLogger } from '../interface/interface';
import { LogContext, LogLevel } from '../interface/interface.types';
import { createLogMessage } from '../utils/utils';

export const createPinoLogger: CreateLogger = (options, parentContext) => {
  const { env, serviceName, datadog, hostname } = options;

  let logContext: LogContext = parentContext ?? {
    scope: ['Main'],
    ddtags: `service:${serviceName},env:${env}`
  };

  const streams: StreamEntry[] = [];

  streams.push({
    stream: PinoPretty({
      colorize: true,
      sync: true
    })
  });

  if (datadog?.apiKey) {
    streams.push({
      stream: pino.transport({
        target: 'pino-datadog-transport',
        options: {
          ddClientConf: { authMethods: { apiKeyAuth: datadog?.apiKey } },
          ddServerConf: { site: 'datadoghq.com' },
          ddsource: 'nodejs',
          service: serviceName,
          hostname: hostname || 'unknown-host',
          ddtags: logContext.ddtags,
          sendImmediate: true
        }
      })
    });
  }

  const baseLogger = pino(
    {
      level: options.level ?? 'info',
      formatters: {
        log: (object) => {
          const { log }: Record<string, any> = object;

          delete object.log;

          return {
            ...object,
            ...log,
            service: serviceName,
            ...logContext,
            scope: logContext.scope.join('/')
          };
        }
      }
    },
    pino.multistream(streams)
  );

  const wrapLogFn = (level: LogLevel, logFn: (...args: any[]) => void) => {
    return async (msgOrData: string | Record<string, any>, data?: Record<string, any>) => {
      const logMessage = createLogMessage(level, msgOrData, data);
      const adaptedPinoMessage = { msg: `[${logContext.scope.join('/')}]`, ...logMessage };

      delete (adaptedPinoMessage as { header?: string }).header;

      logFn.call(baseLogger, adaptedPinoMessage);
    };
  };

  const branch = ({ scope }: { scope: string }) =>
    createPinoLogger(options, {
      ...logContext,
      scope: [...logContext.scope, scope]
    });

  return {
    log: wrapLogFn('info', baseLogger.info),
    info: wrapLogFn('info', baseLogger.info),
    warn: wrapLogFn('warn', baseLogger.warn),
    error: wrapLogFn('error', baseLogger.error),
    fatal: wrapLogFn('fatal', baseLogger.fatal),
    debug: wrapLogFn('debug', baseLogger.debug),
    trace: wrapLogFn('trace', baseLogger.trace),
    branch,
    setTraceContext: (traceContext) => (logContext.traceContext = traceContext),
    addAdditionalTraceContext: (key, value) => {
      logContext.traceContext ??= {};
      logContext.traceContext[key] = value;
    },
    setInstigator: (instigator) => (logContext.instigator = instigator),
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
    getCurrentLogContext: () => logContext
  };
};
