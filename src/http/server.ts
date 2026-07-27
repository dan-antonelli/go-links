// must stay first: patches http/express before they load, otherwise otel misses spans
import '../telemetry/otel';

import { randomUUID } from 'node:crypto';
import express, { type Request, type Response, type NextFunction } from 'express';
import type pino from 'pino';
import { ZodError } from 'zod';
import { InMemoryStore } from '../domain/store';
import { validateCreate } from '../domain/validation';
import { createLinkService, ConflictError, NotFoundError } from '../domain/link-service';
import { logger, childLogger } from '../telemetry/logger';
import { redirectsCounter, linksCreatedCounter } from '../telemetry/otel';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      log: pino.Logger;
    }
  }
}

const linkService = createLinkService(new InMemoryStore());

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string | undefined) || randomUUID();
  req.requestId = requestId;
  req.log = childLogger(requestId);
  res.setHeader('x-request-id', requestId);
  next();
});

app.use(express.json());

app.post('/api/links', async (req: Request, res: Response) => {
  const input = validateCreate(req.body);
  const link = linkService.createLink(input);
  linksCreatedCounter.add(1);
  res.status(201).json({ link });
});

app.get('/api/links', async (_req: Request, res: Response) => {
  res.status(200).json({ links: linkService.listLinks() });
});

app.delete('/api/links/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  linkService.deleteLink(slug);
  res.status(204).end();
});

app.get('/health', async (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const link = linkService.resolveLink(slug);
  redirectsCounter.add(1);
  res.redirect(302, link.url);
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join('; ');
    return res.status(400).json({ error: message, requestId });
  }
  if (err instanceof ConflictError) {
    return res.status(409).json({ error: err.message, requestId });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message, requestId });
  }

  req.log.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'internal server error', requestId });
});

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  logger.info({ port }, 'golinks server listening');
});
