import { useEffect, useMemo, useState } from 'react';
import { Avatar, Empty, Input, Select, Spin, message } from 'antd';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { EnvironmentOutlined, SearchOutlined, SafetyCertificateFilled, ShopOutlined } from '@ant-design/icons';
import { db } from '@/firebase/config';
import { CATEGORIES } from '@/config/categories';
import { categoryLabel } from '@/config/categories';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useStoreFollow } from '@/hooks/useStoreFollow';
import type { Store as StoreType } from '@/types';

export default function Stores() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState<string>();
  const [loading, setLoading] = useState(true);
  useEffect(() => { void getDocs(collection(db, 'stores')).then((snapshot) => setStores(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as StoreType))).catch(() => message.error('Mağazaları yükləmək mümkün olmadı.')).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => {
    const query = term.trim().toLocaleLowerCase('az-AZ');
    return stores.filter((store) => {
      const publicStore = !store.status || (store.status === 'success' && store.adminStatus === 'approved');
      return publicStore && (!query || `${store.name} ${store.description}`.toLocaleLowerCase('az-AZ').includes(query)) && (!category || store.category === category);
    });
  }, [category, stores, term]);
  return <main className="min-h-screen bg-offwhite pb-20 dark:bg-background"><div className="mx-auto max-w-7xl px-6 py-10 md:py-14"><div className="mb-8"><p className="market-section-label mb-2">{t('marketplace')}</p><h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white">{t('stores')}</h1><p className="mt-2 text-muted">{t('storeIntro')}</p></div><div className="mb-8 flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4 md:flex-row dark:border-line-dark dark:bg-graphite"><Input size="large" prefix={<SearchOutlined className="text-muted" />} value={term} onChange={(event) => setTerm(event.target.value)} placeholder={t('storeSearch')} className="md:max-w-xl" /><Select allowClear size="large" value={category} onChange={setCategory} placeholder={t('category')} options={CATEGORIES.map((item) => ({ value: item.key, label: categoryLabel(item.key, language) }))} className="md:w-72" /></div>{loading ? <div className="flex justify-center py-24"><Spin size="large" /></div> : filtered.length === 0 ? <Empty className="py-24" description={t('storeNotFound')} /> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((store) => <StoreCard key={store.id} store={store} />)}</div>}</div></main>;
}

function StoreCard({ store }: { store: StoreType }) {
  const { following, loading, toggle } = useStoreFollow(store.id);
  return <article className="market-surface flex flex-col gap-5 p-5 transition hover:-translate-y-0.5 hover:border-action/40"><Link to={`/magaza/${store.slug}`} className="flex items-center gap-4"><Avatar size={72} src={store.logoUrl} icon={<ShopOutlined />} className="shrink-0 bg-action/10 text-2xl text-action" /><div className="min-w-0"><h2 className="flex items-center gap-1 truncate text-lg font-bold text-ink dark:text-white">{store.name}{store.verified && <SafetyCertificateFilled className="text-action" />}</h2><p className="mt-1 flex items-center gap-1 text-xs text-muted"><EnvironmentOutlined />{store.city ?? 'Azərbaycan'}</p></div></Link><p className="line-clamp-2 min-h-10 text-sm text-muted">{store.description || 'Mağaza haqqında məlumat əlavə edilməyib.'}</p><div className="grid grid-cols-2 gap-3"><button type="button" disabled={loading} onClick={async () => { try { await toggle(); } catch (error) { message.info(error instanceof Error ? error.message : 'İzləmək mümkün olmadı.'); } }} className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${following ? 'bg-action text-white' : 'bg-action/10 text-action hover:bg-action/20'}`}>{following ? 'İzlənilir' : 'İzləyici ol'}</button><Link to={`/magaza/${store.slug}`} className="rounded-xl border border-line px-3 py-2.5 text-center text-sm font-semibold text-ink hover:border-action hover:text-action dark:border-line-dark dark:text-white">Mağazaya bax</Link></div></article>;
}
