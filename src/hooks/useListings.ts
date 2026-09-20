import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, getDocs, limit, query, startAfter, where, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { CategoryKey, Listing, ListingAttributes } from '@/types';

export interface ListingFilters {
  category?: CategoryKey;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'cheapest' | 'expensive' | 'most_viewed' | 'top_rated';
  searchTerm?: string;
  subcategory?: string;
  attributes?: ListingAttributes;
}

const PAGE_SIZE = 50;

function numericValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: () => number }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  return 0;
}

function matches(listing: Listing, filters: ListingFilters) {
  if (filters.category && listing.category !== filters.category) return false;
  if (filters.subcategory && listing.subcategory !== filters.subcategory) return false;
  if (filters.city && listing.city !== filters.city) return false;
  if (filters.minPrice !== undefined && numericValue(listing.price) < filters.minPrice) return false;
  if (filters.maxPrice !== undefined && numericValue(listing.price) > filters.maxPrice) return false;
  if (filters.searchTerm?.trim()) {
    const search = filters.searchTerm.trim().toLowerCase();
    if (!`${listing.title ?? ''} ${listing.description ?? ''}`.toLowerCase().includes(search)) return false;
  }
  return Object.entries(filters.attributes ?? {}).every(([name, selected]) => {
    if (selected === undefined || selected === '' || selected === false) return true;
    const actual = listing.attributes?.[name];
    if (Array.isArray(selected)) return selected.length === 0 || (Array.isArray(actual) && selected.every((value) => actual.includes(value)));
    if (typeof selected === 'string' && typeof actual === 'string') return actual.toLowerCase().includes(selected.toLowerCase());
    return actual === selected;
  });
}

function sortListings(items: Listing[], sort: ListingFilters['sort']) {
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'cheapest': return numericValue(a.price) - numericValue(b.price);
      case 'expensive': return numericValue(b.price) - numericValue(a.price);
      case 'most_viewed': return numericValue(b.viewCount) - numericValue(a.viewCount);
      case 'top_rated': return numericValue(b.ratingAvg) - numericValue(a.ratingAvg);
      default: return numericValue(b.createdAt) - numericValue(a.createdAt);
    }
  });
}

export function useListings(filters: ListingFilters) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<DocumentSnapshot | null>(null);
  const requestRef = useRef(0);
  const filtersRef = useRef(filters);

  useEffect(() => { filtersRef.current = filters; }, [filters]);

  const fetchNextPage = useCallback(async (reset: boolean) => {
    const requestId = reset ? ++requestRef.current : requestRef.current;
    if (reset) {
      setLoading(true); setError(null); cursorRef.current = null; setHasMore(true);
    } else setLoadingMore(true);

    try {
      const cursor = cursorRef.current;
      const pageQuery = cursor
        ? query(collection(db, 'listings'), where('status', '==', 'active'), startAfter(cursor), limit(PAGE_SIZE))
        : query(collection(db, 'listings'), where('status', '==', 'active'), limit(PAGE_SIZE));
      const snapshot = await getDocs(pageQuery);
      const nextCursor = snapshot.docs[snapshot.docs.length - 1] ?? cursor;
      const sourceHasMore = snapshot.docs.length === PAGE_SIZE;
      const page = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Listing);
      const matched = page.filter((item) => matches(item, filtersRef.current));
      if (reset && requestId !== requestRef.current) return;
      cursorRef.current = nextCursor;
      setListings((previous) => reset ? sortListings(matched, filtersRef.current.sort) : sortListings(previous.concat(matched), filtersRef.current.sort));
      setHasMore(sourceHasMore);
    } catch (err) {
      if (reset && requestId !== requestRef.current) return;
      setError(err instanceof Error ? err.message : 'Elanları yükləmək mümkün olmadı.');
    } finally {
      if (reset) setLoading(false); else setLoadingMore(false);
    }
  }, []);

  useEffect(() => { void fetchNextPage(true); }, [fetchNextPage, filters.category, filters.city, filters.minPrice, filters.maxPrice, filters.sort, filters.searchTerm, filters.subcategory, filters.attributes]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) void fetchNextPage(false);
  }, [fetchNextPage, hasMore, loading, loadingMore]);
  const refetch = useCallback(() => { void fetchNextPage(true); }, [fetchNextPage]);
  return { listings, loading, loadingMore, hasMore, error, loadMore, refetch };
}
