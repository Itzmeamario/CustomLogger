import winston from 'winston';
import { StreamEntry } from 'pino';

import { LoggersName } from '../interface/interface';

export type TransportsName = 'datadog' | 'newRelic';

export interface TransportFactory {
  getTransports: () => Map<TransportsName, winston.transports.HttpTransportInstance | StreamEntry>;
}

type BaseTransportFactoryOptions = {
  transportsConfig: {
    [K in TransportsName]?: {
      apiKey: string;
    };
  };
  serviceName: string;
  hostname: string;
};

export type CreateTransportOptionsMap = {
  [K in LoggersName]: {
    logger: K;
  } & BaseTransportFactoryOptions &
    (K extends 'pino'
      ? {
          ddtags: string;
        }
      : {});
};

export type CreateLoggerOptions<T extends LoggersName> = CreateTransportOptionsMap[T];

export type CreateTransportFactory = <T extends LoggersName>(
  options: CreateLoggerOptions<T>
) => TransportFactory;
