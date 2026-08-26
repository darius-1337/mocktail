// cache policy>
// 1 year stored cache was WAY too much time users would recive a lot of
// incorrect data for months without a way to invalidate them

export const CACHE_POLICY = {
	seeded: "public, max-age=86400, stale-while-revalidate=604800",
	random: "no-store",
	metadata: "public, max-age=300",
} as const;

export type CachePolicy = keyof typeof CACHE_POLICY;