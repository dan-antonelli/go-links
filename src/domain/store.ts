export interface Link {
  slug: string;
  url: string;
  createdAt: string;
  hits: number;
}

export interface Store {
  create(link: Link): void;
  list(): Link[];
  get(slug: string): Link | undefined;
  delete(slug: string): boolean;
  incrementHits(slug: string): void;
}

export class InMemoryStore implements Store {
  private readonly links = new Map<string, Link>();

  create(link: Link): void {
    this.links.set(link.slug, link);
  }

  list(): Link[] {
    return Array.from(this.links.values());
  }

  get(slug: string): Link | undefined {
    return this.links.get(slug);
  }

  delete(slug: string): boolean {
    return this.links.delete(slug);
  }

  incrementHits(slug: string): void {
    const link = this.links.get(slug);
    if (link) {
      link.hits += 1;
    }
  }
}
