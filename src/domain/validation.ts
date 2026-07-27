import { z } from 'zod';

const RESERVED_SLUGS = new Set(['api', 'health']);

const createLinkSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'slug must match ^[a-z0-9-]+$')
    .refine((s) => !RESERVED_SLUGS.has(s), { message: 'slug is reserved' }),
  url: z.httpUrl({ message: 'url must be a valid absolute http/https URL' }),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

export function validateCreate(input: unknown): CreateLinkInput {
  return createLinkSchema.parse(input);
}
