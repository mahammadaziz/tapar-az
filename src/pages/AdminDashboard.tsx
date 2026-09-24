import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminAccess from './AdminAccess';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [counts, setCounts] = useState({ pending: 0, active: 0, users: 0, stores: 0 });
  useEffect(() => { if (!isAdmin) return; void Promise.all([
    getCountFromServer(query(collection(db, 'listings'), where('status', '==', 'pending'))),
    getCountFromServer(query(collection(db, 'listings'), where('status', '==', 'active'))),
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(query(collection(db, 'stores'), where('adminStatus', '==', 'waiting'))),
  ]).then(([pending, active, users, stores]) => setCounts({ pending: pending.data().count, active: active.data().count, users: users.data().count, stores: stores.data().count })); }, [isAdmin]);
  if (!isAdmin) return <AdminAccess />;
  return <><div className="flex items-end justify-between mb-8"><div><p className="text-action text-xs uppercase tracking-[.2em]">İcmal</p><h1 className="text-3xl font-bold text-ink mt-2">Dashboard</h1></div><span className="text-xs text-muted">Canlı məlumat</span></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[['Təsdiq gözləyir', counts.pending, '/admin/elanlar', 'text-premium'], ['Mağaza / ödəniş', counts.stores, '/admin/stores', 'text-action'], ['Aktiv elanlar', counts.active, '/admin/elanlar', 'text-success'], ['İstifadəçilər', counts.users, '/admin/users', 'text-info']].map(([label, value, to, color]) => <Link to={String(to)} key={String(label)} className="rounded-2xl border border-line bg-paper shadow-card p-6 hover:border-action transition"><p className="text-sm text-muted">{label}</p><p className={`text-4xl font-bold mt-4 ${color}`}>{value}</p><p className="text-xs text-muted mt-4">Ətraflı bax →</p></Link>)}</div><div className="mt-8 rounded-2xl border border-line bg-paper shadow-card p-6"><h2 className="font-semibold text-ink">Sürətli əməliyyatlar</h2><div className="flex flex-wrap gap-3 mt-4"><Link to="/admin/elanlar" className="bg-action text-white rounded-lg px-4 py-2 text-sm">Elanları yoxla</Link><Link to="/admin/stores" className="border border-line rounded-lg px-4 py-2 text-sm">Mağazaları yoxla</Link><Link to="/admin/users" className="border border-line rounded-lg px-4 py-2 text-sm">User access idarə et</Link></div></div></>;
}
