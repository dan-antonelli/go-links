import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { metrics } from '@opentelemetry/api';

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  metricReaders: [
    new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: 10000,
    }),
  ],
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});

const meter = metrics.getMeter('golinks');

export const redirectsCounter = meter.createCounter('golinks.redirects', {
  description: 'Number of go-link redirects served',
});

export const linksCreatedCounter = meter.createCounter('golinks.links.created', {
  description: 'Number of go-links created',
});
