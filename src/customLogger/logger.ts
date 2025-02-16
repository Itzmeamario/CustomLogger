import pino, { StreamEntry } from 'pino';
import { CreateLogger, LogContext } from './customLogger.types';

import { PinoPretty } from 'pino-pretty';
import 'pino-datadog-transport';

const createLogMessage = (
  msgOrData: string | Record<string, any>,
  prefix: string,
  data?: Record<string, any>
) => {
  if (typeof msgOrData === 'string') {
    return {
      msg: `[${prefix}] - ${msgOrData}`,
      logInfo: data
    };
  } else if (msgOrData && typeof msgOrData === 'object') {
    return {
      msg: `[${prefix}] - Logging object directly`,
      logInfo: msgOrData
    };
  } else {
    throw new Error('Invalid log input. Must be a string or an object.');
  }
};

export const createLogger: CreateLogger = (customOptions, parentContext) => {
  const { env, enableDatadog, serviceName, ddApiKey, hostname } = customOptions;

  let logContext: LogContext = parentContext ?? {
    traceIds: { genesis: 'local' },
    ddtags: `service:${serviceName},env:${env}`,
    extraMetadata: {},
    prefix: ['Main']
  };

  const streams: StreamEntry[] = [];

  streams.push({
    stream: PinoPretty({
      colorize: true,
      sync: true
    })
  });

  if (enableDatadog && ddApiKey) {
    streams.push({
      stream: pino.transport({
        target: 'pino-datadog-transport',
        options: {
          ddClientConf: {
            authMethods: {
              apiKeyAuth: ddApiKey
            }
          },
          ddServerConf: {
            site: 'datadoghq.com'
          },
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
      level: customOptions.level ?? 'info',
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => {
          return {
            ...object,
            service: serviceName,
            traceIds: logContext.traceIds,
            ddtags: logContext.ddtags,
            ...logContext.extraMetadata
          };
        }
      }
    },
    pino.multistream(streams)
  );

  const wrapLogFn = (logFn: (...args: any[]) => void) => {
    return async (msgOrData: string | Record<string, any>, data?: Record<string, any>) => {
      const logMessage = createLogMessage(msgOrData, logContext.prefix.join('/'), data);
      logFn.call(baseLogger, logMessage);
    };
  };

  const updateLogContext = {
    setTraceId: (key: string, value: string) => {
      logContext.traceIds[key] = value;
    },
    removeTraceId: (key: string) => {
      delete logContext.traceIds[key];
    },
    setDdtags: (tags: string) => {
      logContext.ddtags = tags;
    },
    addExtraMetadata: (key: string, value: any) => {
      logContext.extraMetadata[key] = value;
    },
    removeExtraMetadata: (key: string) => {
      delete logContext.extraMetadata[key];
    },
    getCurrentLogContext: () => logContext
  };

  const branch = (branchOptions: { context: string }) => {
    const newLogContext: LogContext = {
      ...logContext,
      prefix: [...logContext.prefix, branchOptions.context]
    };

    return createLogger(customOptions, newLogContext);
  };

  return {
    ...baseLogger,
    info: wrapLogFn(baseLogger.info),
    warn: wrapLogFn(baseLogger.warn),
    error: wrapLogFn(baseLogger.error),
    fatal: wrapLogFn(baseLogger.fatal),
    debug: wrapLogFn(baseLogger.debug),
    trace: wrapLogFn(baseLogger.trace),
    branch,
    ...updateLogContext
  };
};
