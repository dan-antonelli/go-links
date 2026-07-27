import type { Store, Link } from './store';
import type { CreateLinkInput } from './validation';

export class ConflictError extends Error {
  constructor(slug: string) {
    super(`link with slug "${slug}" already exists`);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(slug: string) {
    super(`no link found for slug "${slug}"`);
    this.name = 'NotFoundError';
  }
}

export interface LinkService {
  createLink(input: CreateLinkInput): Link;
  listLinks(): Link[];
  resolveLink(slug: string): Link;
  deleteLink(slug: string): void;
}

export function createLinkService(store: Store): LinkService {
  function createLink(input: CreateLinkInput): Link {
    if (store.get(input.slug)) {
      throw new ConflictError(input.slug);
    }
    const link: Link = { ...input, createdAt: new Date().toISOString(), hits: 0 };
    store.create(link);
    return link;
  }

  function listLinks(): Link[] {
    return store.list();
  }

  function resolveLink(slug: string): Link {
    if (!store.get(slug)) {
      throw new NotFoundError(slug);
    }
    store.incrementHits(slug);
    return store.get(slug) as Link;
  }

  function deleteLink(slug: string): void {
    if (!store.delete(slug)) {
      throw new NotFoundError(slug);
    }
  }

  return { createLink, listLinks, resolveLink, deleteLink };
}
