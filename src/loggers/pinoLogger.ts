import pino, { StreamEntry } from 'pino';
import { PinoPretty } from 'pino-pretty';
import 'pino-datadog-transport';

import { CreateLogger, LogContext, LogLevel } from '../interface/interface.types';
import { createLogMessage } from '../utils/utils';

export const createPinoLogger: CreateLogger = (options, parentContext) => {
  const { env, enableDatadog, serviceName, ddApiKey, hostname } = options;

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
          ddClientConf: { authMethods: { apiKeyAuth: ddApiKey } },
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

          delete object.header;
          delete object.log;

          return {
            ...object,
            ...log,
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

  const wrapLogFn = (level: LogLevel, logFn: (...args: any[]) => void) => {
    return async (msgOrData: string | Record<string, any>, data?: Record<string, any>) => {
      const logMessage = createLogMessage(level, logContext.prefix.join('/'), msgOrData, data);
      const adaptedPinoMessage = { msg: logMessage.header, ...logMessage };

      delete (adaptedPinoMessage as { header?: string }).header;

      logFn.call(baseLogger, adaptedPinoMessage);
    };
  };

  const branch = (branchOptions: { context: string }) =>
    createPinoLogger(options, {
      ...logContext,
      prefix: [...logContext.prefix, branchOptions.context]
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
    setTraceId: (key: string, value: string) => (logContext.traceIds[key] = value),
    removeTraceId: (key: string) => delete logContext.traceIds[key],
    setDdtags: (tags: string) => (logContext.ddtags = tags),
    addExtraMetadata: (key: string, value: any) => (logContext.extraMetadata[key] = value),
    removeExtraMetadata: (key: string) => delete logContext.extraMetadata[key],
    getCurrentLogContext: () => logContext
  };
};
