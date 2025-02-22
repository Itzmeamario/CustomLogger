import winston from 'winston';

import { LoggersName, Transports } from '../interface/interface';

// Module pattern or Closure-Based Object
export const createTransportFactory = (
  loggerName: LoggersName,
  transportsConfig: Transports,
  serviceName: string,
  hostname: string
) => {
  const transports = new Map<string, winston.transports.HttpTransportInstance | unknown>();

  if (loggerName === 'pino') {
  }
  if (loggerName === 'winston') {
    if ('datadog' in transportsConfig) {
      const { datadog } = transportsConfig;

      if (datadog && datadog.apiKey) {
        const datadogTransport = new winston.transports.Http({
          host: 'http-intake.logs.datadoghq.com',
          path: `/api/v2/logs?dd-api-key=${datadog.apiKey}&ddsource=nodejs&service=${serviceName}&host=${hostname}`,
          ssl: true
        });

        transports.set('datadog', datadogTransport);
      }
    }

    if ('newRelic' in transportsConfig) {
      const { newRelic } = transportsConfig;

      if (newRelic && newRelic.apiKey) {
        const newRelicTransport = new winston.transports.Http({
          host: 'http-intake.logs.datadoghq.com',
          path: `/api/v2/logs?dd-api-key=${newRelic.apiKey}&ddsource=nodejs&service=${serviceName}&host=${hostname}`,
          ssl: true
        });

        transports.set('newRelic', newRelicTransport);
      }
    }
  }

  return {
    getTransports: () => {
      return transports;
    }
  };
};
