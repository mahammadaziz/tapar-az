import { useCallback, useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, limit, query, where, type DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Store } from '@/types';

function toStore(data: DocumentData, id: string): Store {
  return { id, ...data } as Store;
}

export function useMyStore(ownerId?: string) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(Boolean(ownerId));

  const reload = useCallback(async () => {
    if (!ownerId) { setStore(null); setLoading(false); return; }
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'stores'), where('ownerId', '==', ownerId), limit(1)));
      setStore(snapshot.docs[0] ? toStore(snapshot.docs[0].data(), snapshot.docs[0].id) : null);
    } catch {
      // Keep the UI usable when the deployed Firestore rules reject the query.
      setStore(null);
    } finally { setLoading(false); }
  }, [ownerId]);

  useEffect(() => { void reload(); }, [reload]);
  return { store, loading, reload };
}

export async function getStoreBySlug(slug: string) {
  const snapshot = await getDocs(query(collection(db, 'stores'), where('slug', '==', slug), limit(1)));
  if (!snapshot.docs[0]) return null;
  const store = toStore(snapshot.docs[0].data(), snapshot.docs[0].id);
  if (store.status && (store.status !== 'success' || store.adminStatus !== 'approved')) return null;
  return store;
}

export async function getStoreById(id: string) {
  const snapshot = await getDoc(doc(db, 'stores', id));
  return snapshot.exists() ? toStore(snapshot.data(), snapshot.id) : null;
}

export function storeSlug(value: string) {
  return value.toLocaleLowerCase('az-AZ').trim().replace(/ə/g, 'e').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
