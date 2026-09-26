import { useEffect, useState } from 'react';
import { Button, Empty, Spin, Table, Tag, message } from 'antd';
import { collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';
import type { Store } from '@/types';
import AdminAccess from './AdminAccess';
import { sendBrevoEmail } from '@/utils/email';

export default function AdminStores() {
  const { isAdmin } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'stores'));
      setStores(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Store));
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Mağazalar yüklənmədi.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);

  const review = async (store: Store, approved: boolean) => {
    if (approved && store.status !== 'success') {
      message.warning('Mağaza yalnız backend ödəniş statusunu success etdikdən sonra təsdiqlənə bilər.');
      return;
    }
    setWorking(store.id);
    try {
      await updateDoc(doc(db, 'stores', store.id), {
        adminStatus: approved ? 'approved' : 'rejected',
        verified: approved,
        updatedAt: serverTimestamp(),
      });
      if (store.ownerEmail) {
        await sendBrevoEmail({
          to: store.ownerEmail,
          subject: approved ? 'Mağazanız təsdiqləndi — TAPAR.AZ' : 'Mağaza təsdiqlənmədi — TAPAR.AZ',
          text: approved ? `Mağazanız təsdiqləndi və artıq görünür: ${window.location.origin}/magaza/${store.slug}` : 'Mağazanız admin yoxlamasından keçmədi.',
        }).catch(() => message.warning('Status dəyişdi, lakin mağaza sahibinə email göndərilmədi.'));
      }
      setStores((items) => items.map((item) => item.id === store.id ? { ...item, adminStatus: approved ? 'approved' : 'rejected', verified: approved } : item));
      message.success(approved ? 'Mağaza təsdiqləndi və görünən oldu.' : 'Mağaza rədd edildi.');
    } catch (error) { message.error(error instanceof Error ? error.message : 'Mağaza statusu dəyişdirilə bilmədi.'); }
    finally { setWorking(null); }
  };

  if (!isAdmin) return <AdminAccess />;
  return <div className="max-w-[1400px] mx-auto py-3">
    <div className="mb-8"><p className="market-section-label">Mağaza moderasiyası</p><h1 className="font-display text-3xl font-bold text-ink dark:text-white mt-2">Mağazalar və ödənişlər</h1><p className="text-sm text-muted mt-2">Backend `status: success` etdikdən sonra admin mağazanı təsdiqləyir.</p></div>
    {loading ? <div className="flex justify-center py-20"><Spin size="large" /></div> : !stores.length ? <div className="market-surface py-20"><Empty description="Mağaza yoxdur" /></div> : <div className="market-surface overflow-hidden"><Table<Store> rowKey="id" dataSource={[...stores].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))} scroll={{ x: 1100 }} columns={[
      { title: 'Mağaza', key: 'store', width: 250, render: (_, store) => <div><p className="font-semibold">{store.name}</p><p className="text-xs text-muted break-all">{store.id}</p></div> },
      { title: 'Sahib', key: 'owner', render: (_, store) => <div><p>{store.ownerEmail || '—'}</p><p className="text-xs text-muted">{store.ownerId}</p></div> },
      { title: 'Ödəniş', key: 'payment', render: (_, store) => <div><Tag color={store.status === 'success' ? 'green' : store.status === 'failed' ? 'red' : 'gold'}>{store.status || 'legacy'}</Tag><p className="mt-1 text-sm">{store.amount ?? store.price ?? '—'} AZN</p><p className="text-xs text-muted break-all">{store.transaction || store.orderId || '—'}</p></div> },
      { title: 'Admin', key: 'admin', render: (_, store) => <Tag color={store.adminStatus === 'approved' ? 'green' : store.adminStatus === 'rejected' ? 'red' : 'gold'}>{store.adminStatus || (store.verified ? 'approved' : 'waiting')}</Tag> },
      { title: 'Əməliyyat', key: 'actions', width: 230, render: (_, store) => <div className="flex gap-2"><Button type="primary" size="small" disabled={store.adminStatus === 'approved'} loading={working === store.id} onClick={() => void review(store, true)}>Təsdiqlə</Button><Button danger size="small" disabled={store.adminStatus === 'rejected'} loading={working === store.id} onClick={() => void review(store, false)}>Rədd et</Button></div> },
    ]} /></div>}
  </div>;
}

function toMillis(value: unknown) {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: () => number }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  return 0;
}
