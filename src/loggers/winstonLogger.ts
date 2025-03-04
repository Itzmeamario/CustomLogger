import winston from 'winston';
import chalk from 'chalk';
import util from 'util';

import { CreateLogger, CreateLoggerOptionsMap } from '../interface/interface';
import { LogContext, ExtendedLog, LogLevel, Log } from '../interface/interface.types';
import { createLogMessage } from '../utils/utils';
import { createTransportFactory } from '../factory/transportFactory';

// https://www.npmjs.com/package/redact-secrets

// Helper to clean internal Winston symbols
const cleanMeta = (meta: ExtendedLog): Log =>
  Object.fromEntries(Object.entries(meta).filter(([key]) => typeof key === 'string')) as Log;

export const createWinstonLogger: CreateLogger = (options, parentContext) => {
  if (options.logger !== 'winston') {
    throw new Error('Invalid logger type for createWinstonLogger. Expected "winston".');
  }

  const {
    serviceName,
    lightMode = false,
    localMode = true,
    newLineEOL = true,
    level = 'info',
    env = 'staging',
    hostname
  } = options as CreateLoggerOptionsMap['winston'];

  let logContext: LogContext = parentContext ?? {
    scope: ['Main'],
    ddtags: `service:${serviceName},env:${env}`
  };

  const errorRegex = /(error|fatal)/i;

  const winstonLogger = winston.createLogger({
    level,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const messageHeader = `${chalk.green(timestamp)} [${level}]: [${meta.scope}]\n`;

            // Ensure meta is properly typed as ExtendedLog
            const typedLog = meta as ExtendedLog;

            // Clean up meta if needed (e.g., removing Winston-specific symbols)
            let cleanedLog = cleanMeta(typedLog);

            const loggableData = lightMode
              ? {
                  message,
                  ...(cleanedLog.logInfo && { logInfo: cleanedLog.logInfo }),
                  ...(cleanedLog.error && { error: cleanedLog.error })
                }
              : { ...cleanedLog, message };

            // Check if there's an error stack trace and format it
            if (loggableData.error instanceof Error || errorRegex.test(level)) {
              return `${messageHeader}${chalk.red(util.inspect(loggableData, { depth: null }))}${newLineEOL ? '\n' : ''}`;
            }

            // Otherwise, format the loggable data for display
            const metaString = Object.keys(loggableData).length
              ? util.inspect(loggableData, { colors: true, depth: null })
              : '';

            // Return the final formatted message
            return `${messageHeader}${metaString}${newLineEOL ? '\n' : ''}`;
          })
        )
      })
    ]
  });

  // Strategy for all transports (datadog, new relic, etc)
  winstonLogger.log('info', 'Adding transports', { scope: 'Initializer' });
  if (!localMode) {
    const transportFactory = createTransportFactory<'winston'>({
      logger: 'winston',
      transportsConfig: {
        datadog: {
          apiKey: process.env.DD_API_KEY || ''
        },
        newRelic: {
          apiKey: process.env.NR_API_KEY || ''
        }
      },
      serviceName,
      hostname
    });

    const transports = transportFactory.getTransports();

    transports.forEach((v, k) => {
      winstonLogger.add(v as winston.transports.HttpTransportInstance);
      winstonLogger.log('info', `Added transport ${k} for ${logContext.scope}`, {
        scope: 'Initializer',
        logInfo: {
          transport: k
        }
      });
    });
  }

  const wrapLogFn = (level: LogLevel) => {
    return (msgOrData: string | Record<string, any>, data?: Record<string, any>) => {
      const logMessage = createLogMessage(level, msgOrData, data);

      const sanitizedLog: Partial<typeof logMessage> = { ...logMessage };

      delete sanitizedLog.message;

      const loggableData = {
        ...sanitizedLog,
        level: level.replace(/\x1B\[[0-9;]*m/g, ''),
        service: serviceName,
        timestamp: new Date().toISOString(),
        hostname,
        ...logContext,
        scope: logContext.scope.join('/')
      };

      // Log the message using Winston with the loggableData
      winstonLogger.log(level, logMessage.message, loggableData);
    };
  };

  return {
    log: wrapLogFn('info'),
    info: wrapLogFn('info'),
    warn: wrapLogFn('warn'),
    error: wrapLogFn('error'),
    fatal: wrapLogFn('error'),
    debug: wrapLogFn('debug'),
    trace: wrapLogFn('silly'),

    branch: ({ scope }) =>
      createWinstonLogger(options, {
        ...logContext,
        scope: logContext.scope.concat(scope)
      }),
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

      // Append valid tags
      logContext.ddtags += `,${validTags.join(',')}`;
    },
    addMetadata: (key, value) => {
      if (typeof key !== 'string' || !key.trim()) {
        throw new Error('Invalid metadata key.');
      }
      logContext.metadata ??= {};
      logContext.metadata[key] = value;
    },
    getCurrentLogContext: () => logContext
  };
};
