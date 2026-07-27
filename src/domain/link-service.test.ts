import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from './store';
import { createLinkService, ConflictError, NotFoundError, type LinkService } from './link-service';

describe('link-service', () => {
  let service: LinkService;

  beforeEach(() => {
    service = createLinkService(new InMemoryStore());
  });

  describe('createLink', () => {
    it('stores a link', () => {
      const link = service.createLink({ slug: 'docs', url: 'https://example.com/docs' });
      expect(link.slug).toBe('docs');
      expect(link.url).toBe('https://example.com/docs');
      expect(link.hits).toBe(0);
      expect(service.listLinks()).toEqual([link]);
    });

    it('throws ConflictError on a duplicate slug', () => {
      service.createLink({ slug: 'docs', url: 'https://example.com/docs' });
      expect(() => service.createLink({ slug: 'docs', url: 'https://example.com/other' })).toThrow(
        ConflictError,
      );
    });
  });

  describe('resolveLink', () => {
    it('returns the link and increments hits', () => {
      service.createLink({ slug: 'docs', url: 'https://example.com/docs' });
      const first = service.resolveLink('docs');
      expect(first.hits).toBe(1);
      const second = service.resolveLink('docs');
      expect(second.hits).toBe(2);
    });

    it('throws NotFoundError on a missing slug', () => {
      expect(() => service.resolveLink('missing')).toThrow(NotFoundError);
    });
  });

  describe('deleteLink', () => {
    it('throws NotFoundError when the slug is missing', () => {
      expect(() => service.deleteLink('missing')).toThrow(NotFoundError);
    });
  });
});
