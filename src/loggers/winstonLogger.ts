import winston from 'winston';
import chalk from 'chalk';
import util from 'util';

import { CreateLogger, LogContext, ExtendedMetaType, LogLevel } from '../interface/interface.types';
import { createLogMessage } from '../utils/utils';

// Helper to clean internal Winston symbols
const cleanMeta = (meta: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(meta).filter(([key]) => typeof key === 'string'));

export const createWinstonLogger: CreateLogger = (options, parentContext) => {
  const { serviceName, lightMode = false, newLineEOL = false, level = 'info', env } = options;

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
          winston.format.printf(({ level, message: header, timestamp, ...meta }) => {
            const messageHeader = `${chalk.green(timestamp)} [${level}]: ${header}\n`;

            // Ensure meta is of type ExtendedMetaType
            const typedMeta = meta as ExtendedMetaType;

            // Remove Winston symbols for clear logs
            let { log }: Record<string, any> = cleanMeta(typedMeta);

            const logMetadata = !lightMode
              ? {
                  level: level.replace(/\x1B\[[0-9;]*m/g, ''),
                  service: serviceName,
                  timestamp,
                  ...logContext,
                  scope: logContext.scope.join('/')
                }
              : {};

            const loggableData = { ...log, ...logMetadata };

            // Extract and log the error stack trace if present
            if (loggableData.error instanceof Error || errorRegex.test(level)) {
              return `${messageHeader}${chalk.red(util.inspect(loggableData, { depth: null }))}${newLineEOL ? '\n' : ''}`;
            }

            const metaString = Object.keys(log).length
              ? util.inspect(loggableData, { colors: true, depth: null })
              : '';

            const extraSpace = Object.keys(log).length && newLineEOL ? '\n' : '';

            return `${messageHeader}${metaString}${extraSpace}`;
          })
        )
      })
    ]
  });

  const wrapLogFn = (level: LogLevel) => {
    return (msgOrData: string | Record<string, any>, data?: Record<string, any>) => {
      const logMessage = createLogMessage(level, logContext.scope.join('/'), msgOrData, data);

      winstonLogger.log(level, logMessage.header, { log: logMessage.log });
    };
  };

  const branch = ({ scope }: { scope: string }) =>
    createWinstonLogger(options, {
      ...logContext,
      scope: logContext.scope.concat(scope)
    });

  return {
    log: wrapLogFn('info'),
    info: wrapLogFn('info'),
    warn: wrapLogFn('warn'),
    error: wrapLogFn('error'),
    fatal: wrapLogFn('error'),
    debug: wrapLogFn('debug'),
    trace: wrapLogFn('silly'),
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
