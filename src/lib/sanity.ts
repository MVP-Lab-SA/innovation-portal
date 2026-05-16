import { createClient, type ClientConfig, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

/**
 * Sanity CMS Configuration — lazy-initialized to avoid build failures
 */

function getProjectId(): string {
  return (
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
    process.env.SANITY_PROJECT_ID ||
    process.env.NEXT_PUBLIC_sanity_SANITY_PROJECT_ID ||
    process.env.sanity_SANITY_API_PROJECT_ID ||
    process.env.sanity_SANITY_STUDIO_PROJECT_ID ||
    ''
  );
}

function getDataset(): string {
  return (
    process.env.NEXT_PUBLIC_SANITY_DATASET ||
    process.env.SANITY_DATASET ||
    process.env.NEXT_PUBLIC_sanity_SANITY_DATASET ||
    process.env.sanity_SANITY_API_DATASET ||
    process.env.sanity_SANITY_STUDIO_DATASET ||
    'production'
  );
}

function getConfig(): ClientConfig {
  return {
    projectId: getProjectId(),
    dataset: getDataset(),
    apiVersion: '2024-10-01',
    useCdn: process.env.NODE_ENV === 'production',
  };
}

let _sanityClient: SanityClient | null = null;
let _sanityReadClient: SanityClient | null = null;
let _sanityWriteClient: SanityClient | null = null;

/** Public read-only client (safe for browser) */
export function getSanityClient(): SanityClient {
  if (!_sanityClient) {
    if (!getProjectId()) throw new Error('Sanity is not configured: missing SANITY_PROJECT_ID');
    _sanityClient = createClient(getConfig());
  }
  return _sanityClient;
}

/** Server-side read client with token (for previews, drafts) */
export function getSanityReadClient(): SanityClient {
  if (!_sanityReadClient) {
    if (!getProjectId()) throw new Error('Sanity is not configured');
    _sanityReadClient = createClient({
      ...getConfig(),
      useCdn: false,
      token: process.env.SANITY_API_READ_TOKEN || process.env.sanity_SANITY_API_READ_TOKEN,
    });
  }
  return _sanityReadClient;
}

/** Server-side write client (for mutations - server only!) */
export function getSanityWriteClient(): SanityClient {
  if (!_sanityWriteClient) {
    if (!getProjectId()) throw new Error('Sanity is not configured');
    _sanityWriteClient = createClient({
      ...getConfig(),
      useCdn: false,
      token: process.env.SANITY_API_WRITE_TOKEN || process.env.sanity_SANITY_API_WRITE_TOKEN,
    });
  }
  return _sanityWriteClient;
}

/** Image URL builder for Sanity images */
export function urlForImage(source: SanityImageSource) {
  return imageUrlBuilder(getSanityClient()).image(source);
}

/** Check if Sanity is configured */
export function isSanityConfigured(): boolean {
  return !!getProjectId();
}

/** Common GROQ queries */
export const SANITY_QUERIES = {
  posts: `*[_type == "post" && publishedAt < now()] | order(publishedAt desc) {
    _id, title, slug, excerpt, publishedAt, mainImage, "author": author->name
  }`,
  postBySlug: (slug: string) => `*[_type == "post" && slug.current == "${slug}"][0] {
    _id, title, slug, body, publishedAt, mainImage,
    "author": author->{name, image},
    "categories": categories[]->title
  }`,
  announcements: `*[_type == "announcement" && publishedAt < now() && active == true] | order(publishedAt desc)[0...10] {
    _id, title, body, publishedAt, severity, link
  }`,
  pageBySlug: (slug: string) => `*[_type == "page" && slug.current == "${slug}"][0] {
    _id, title, slug, body, lastUpdated
  }`,
};
