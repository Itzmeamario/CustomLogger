import winston from 'winston';
import pino, { StreamEntry } from 'pino';

import { CreateTransportFactory, TransportsName } from './transportFactory.types';

// Module pattern or Closure-Based Object
export const createTransportFactory: CreateTransportFactory = (options) => {
  const { logger, transportsConfig, serviceName, hostname } = options;

  const transports = new Map<
    TransportsName,
    winston.transports.HttpTransportInstance | StreamEntry
  >();

  if (logger === 'pino') {
    if ('ddtags' in options) {
      const { ddtags } = options;

      if ('datadog' in transportsConfig) {
        const { datadog } = transportsConfig;

        // Change this for a transport declaring instead of assigning
        const datadogTransport = pino.transport({
          target: 'pino-datadog-transport',
          options: {
            ddClientConf: { authMethods: { apiKeyAuth: datadog?.apiKey } },
            ddServerConf: { site: 'datadoghq.com' },
            ddsource: 'nodejs',
            service: serviceName,
            hostname,
            ddtags: ddtags,
            sendImmediate: true
          }
        });

        transports.set('datadog', datadogTransport);
      }
    }
  }

  if (logger === 'winston') {
    if ('datadog' in transportsConfig) {
      const { datadog } = transportsConfig;

      const datadogTransport = new winston.transports.Http({
        host: 'http-intake.logs.datadoghq.com',
        path: `/api/v2/logs?dd-api-key=${datadog?.apiKey}&ddsource=nodejs&service=${serviceName}&host=${hostname}`,
        ssl: true
      });

      transports.set('datadog', datadogTransport);
    }

    if ('newRelic' in transportsConfig) {
      const { newRelic } = transportsConfig;

      const newRelicTransport = new winston.transports.Http({
        host: 'http-intake.logs.datadoghq.com',
        path: `/api/v2/logs?dd-api-key=${newRelic?.apiKey}&ddsource=nodejs&service=${serviceName}&host=${hostname}`,
        ssl: true
      });

      transports.set('newRelic', newRelicTransport);
    }
  }

  return {
    getTransports: () => {
      return transports;
    }
  };
};
