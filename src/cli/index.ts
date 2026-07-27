#!/usr/bin/env node
import { Command } from 'commander';

interface Link {
  slug: string;
  url: string;
  createdAt: string;
  hits: number;
}

const baseUrl = process.env.GOLINKS_API_URL ?? 'http://localhost:3000';

async function apiRequest(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const message = body.error ?? res.statusText;
    console.error(`Error (${res.status}): ${message}`);
    process.exitCode = 1;
    return undefined;
  }

  return res.status === 204 ? undefined : res.json();
}

const program = new Command();
program.name('golinks').description('Manage internal go-links').version('0.1.0');

program
  .command('add <slug> <url>')
  .description('Create a new go link')
  .action(async (slug: string, url: string) => {
    const result = await apiRequest('/api/links', {
      method: 'POST',
      body: JSON.stringify({ slug, url }),
    });
    if (result) {
      console.log(`Created: go/${result.link.slug} -> ${result.link.url}`);
    }
  });

program
  .command('ls')
  .description('List all go links')
  .action(async () => {
    const result = await apiRequest('/api/links');
    if (!result) return;
    if (result.links.length === 0) {
      console.log('No links yet.');
      return;
    }
    console.table(
      result.links.map((link: Link) => ({
        slug: link.slug,
        url: link.url,
        hits: link.hits,
        createdAt: link.createdAt,
      })),
    );
  });

program
  .command('rm <slug>')
  .description('Delete a go link')
  .action(async (slug: string) => {
    await apiRequest(`/api/links/${slug}`, { method: 'DELETE' });
    if (process.exitCode !== 1) {
      console.log(`Deleted: ${slug}`);
    }
  });

program.parseAsync(process.argv);
