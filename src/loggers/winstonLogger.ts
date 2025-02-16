import winston from 'winston';
import chalk from 'chalk';
import util from 'util';

import { CreateLogger, LogContext, ExtendedMetaType, LogLevel } from '../interface/interface.types';
import { createLogMessage } from '../utils/utils';

// Helper to clean internal Winston symbols
const cleanMeta = (meta: Record<string, unknown>) => {
  const cleanMeta = { ...meta };

  // Remove internal Winston symbols
  Object.getOwnPropertySymbols(meta).forEach((symbol) => {
    delete cleanMeta[symbol as unknown as string];
  });
  return cleanMeta;
};

export const createWinstonLogger: CreateLogger = (options, parentContext) => {
  const { serviceName, lightMode = false, newLineEOL = false, level } = options;

  let logContext: LogContext = parentContext ?? {
    traceIds: { genesis: 'local' },
    ddtags: `service:${serviceName}`,
    extraMetadata: {},
    prefix: ['Main']
  };

  const winstonLogger = winston.createLogger({
    level: level ?? 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.prettyPrint(),
          winston.format.printf(({ level, message: header, timestamp, ...meta }) => {
            const errorRegex = /(error|fatal)/i;

            const messageHeader = `${chalk.green(timestamp)} [${level}]: ${header}\n`;

            // Assert meta to the extended type
            const typedMeta = meta as ExtendedMetaType;

            // Remove Winston symbols for clear logs
            let cleanedMeta = cleanMeta(typedMeta);

            const { log }: Record<string, any> = cleanedMeta;

            const logMetadata = {
              service: serviceName,
              traceIds: logContext.traceIds,
              ddtags: logContext.ddtags,
              ...logContext.extraMetadata
            };

            const loggableData = {
              ...log,
              ...(!lightMode && { ...logMetadata })
            };

            // Extract and log the error stack trace if present
            if (loggableData.error instanceof Error || errorRegex.test(level)) {
              return `${messageHeader}${chalk.red(util.inspect(loggableData, { depth: null }))}${newLineEOL ? '\n' : ''}`;
            }

            const metaString = Object.keys(log!).length
              ? util.inspect(loggableData, { colors: true, depth: null })
              : '';

            const extraSpace = Object.keys(cleanedMeta).length && newLineEOL ? '\n' : '';

            return `${messageHeader}${metaString}${extraSpace}`;
          })
        )
      })
    ]
  });

  const wrapLogFn = (level: LogLevel) => {
    return (msgOrData: string | Record<string, any>, data?: Record<string, any>) => {
      const logMessage = createLogMessage(level, logContext.prefix.join('/'), msgOrData, data);

      winstonLogger.log(level, logMessage.header, { log: logMessage.log });
    };
  };

  const branch = (branchOptions: { context: string }) =>
    createWinstonLogger(options, {
      ...logContext,
      prefix: [...logContext.prefix, branchOptions.context]
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
    setTraceId: (key, value) => (logContext.traceIds[key] = value),
    removeTraceId: (key) => delete logContext.traceIds[key],
    setDdtags: (tags) => (logContext.ddtags = tags),
    addExtraMetadata: (key, value) => (logContext.extraMetadata[key] = value),
    removeExtraMetadata: (key) => delete logContext.extraMetadata[key],
    getCurrentLogContext: () => logContext
  };
};
