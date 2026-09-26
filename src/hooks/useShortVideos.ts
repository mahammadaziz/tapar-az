import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { ShortVideo } from '@/types';

export function useShortVideos(limitCount = 30) {
  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'short_videos'), where('status', '==', 'active')), (snapshot) => {
      const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ShortVideo)
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0, limitCount);
      setVideos(next); setLoading(false);
    }, () => { setVideos([]); setLoading(false); });
    return unsubscribe;
  }, [limitCount]);
  return { videos, loading };
}

function toMillis(value: unknown) {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: () => number }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  return 0;
}
