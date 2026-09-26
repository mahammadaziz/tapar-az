import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Empty, Input, InputNumber, Select, Spin, message } from 'antd';
import { EnvironmentOutlined, EditOutlined, PhoneOutlined, SafetyCertificateFilled, SearchOutlined, ShopOutlined } from '@ant-design/icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { CATEGORIES, categoryLabel } from '@/config/categories';
import { getStoreBySlug } from '@/hooks/useStore';
import { useStoreFollow } from '@/hooks/useStoreFollow';
import { useAuth } from '@/context/AuthContext';
import ListingCard from '@/components/ListingCard';
import type { Listing, Store as StoreType } from '@/types';

const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function Store() {
  const { slug } = useParams();
  const [store, setStore] = useState<StoreType | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    if (!slug) return undefined;
    void getStoreBySlug(slug).then(async (result) => {
      if (!active) return;
      setStore(result);
      if (!result) return;
      const snapshot = await getDocs(query(collection(db, 'listings'), where('storeId', '==', result.id), where('status', '==', 'active')));
      if (active) setListings(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Listing));
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);
  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Spin size="large" /></div>;
  if (!store) return <Empty className="py-24" description="Mağaza tapılmadı" />;
  return <StoreContent store={store} listings={listings} />;
}

function StoreContent({ store, listings }: { store: StoreType; listings: Listing[] }) {
  const { user } = useAuth();
  const isOwner = user?.uid === store.ownerId;
  const { following, loading, toggle } = useStoreFollow(store.id);
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState<string>();
  const [minPrice, setMinPrice] = useState<number>();
  const [maxPrice, setMaxPrice] = useState<number>();
  const [premiumOnly, setPremiumOnly] = useState(false);
  const filtered = useMemo(() => listings.filter((listing) => {
    const search = term.trim().toLocaleLowerCase('az-AZ');
    const activePremium = Boolean(listing.isPremium && (!listing.premiumUntil || Number(listing.premiumUntil) > Date.now()));
    return (!search || `${listing.title} ${listing.description}`.toLocaleLowerCase('az-AZ').includes(search)) && (!category || listing.category === category) && (minPrice === undefined || (listing.price ?? 0) >= minPrice) && (maxPrice === undefined || (listing.price ?? 0) <= maxPrice) && (!premiumOnly || activePremium);
  }).sort((a, b) => Number(Boolean(b.isPremium)) - Number(Boolean(a.isPremium))), [listings, term, category, minPrice, maxPrice, premiumOnly]);
  const status = storeStatus(store);
  return <main className="min-h-screen bg-[#f5f6f8] pb-20 dark:bg-background"><div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
    <section className="rounded-2xl border border-[#e9ebef] bg-white p-5 shadow-[0_2px_12px_rgb(17_24_39/0.04)] dark:border-line-dark dark:bg-graphite md:p-8"><div className="flex flex-col gap-6 md:flex-row md:items-start"><Avatar size={112} src={store.logoUrl} icon={<ShopOutlined />} className="shrink-0 border-4 border-[#f5f6f8] bg-action text-4xl text-white dark:border-background" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-3xl font-bold tracking-tight text-ink dark:text-white">{store.name}</h1>{store.verified && <SafetyCertificateFilled className="text-lg text-action" />}</div><p className="mt-2 text-sm leading-6 text-muted">{store.description || 'Mağaza haqqında məlumat əlavə edilməyib.'}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted"><span className={status.open ? 'font-semibold text-success' : 'font-semibold text-urgent'}>{status.label}</span>{store.address && <span className="inline-flex items-center gap-1"><EnvironmentOutlined />{store.address}</span>}{store.phone && <span className="inline-flex items-center gap-1"><PhoneOutlined />{store.phone}</span>}</div></div><div className="flex shrink-0 flex-wrap gap-2">{isOwner ? <Link to="/magaza-yarat" className="market-secondary-action"><EditOutlined /> Redaktə et</Link> : <button type="button" disabled={loading} onClick={async () => { try { await toggle(); } catch (error) { message.info(error instanceof Error ? error.message : 'İzləmək mümkün olmadı.'); } }} className={`rounded-lg px-5 py-2.5 text-sm font-semibold ${following ? 'bg-action text-white' : 'border border-line text-ink hover:border-action hover:text-action dark:border-line-dark dark:text-white'}`}>{following ? 'İzlənilir' : 'İzləyici ol'}</button>}<Link to="/elan-yerlesdir" className="market-action">Elan yerləşdir</Link></div></div></section>
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]"><aside className="rounded-2xl border border-[#e9ebef] bg-white p-5 shadow-[0_2px_12px_rgb(17_24_39/0.04)] dark:border-line-dark dark:bg-graphite lg:sticky lg:top-24"><p className="mb-4 font-display text-lg font-bold text-ink dark:text-white">Mağazada axtarış</p><Input prefix={<SearchOutlined className="text-muted" />} value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Məhsul axtarışı" size="large" /><label className="mt-5 block text-xs font-semibold text-muted">Kateqoriya<Select allowClear className="mt-1.5 w-full" placeholder="Bütün kateqoriyalar" value={category} onChange={setCategory} options={CATEGORIES.map((item) => ({ value: item.key, label: categoryLabel(item.key, 'az') }))} /></label><label className="mt-4 block text-xs font-semibold text-muted">Qiymət, AZN<div className="mt-1.5 grid grid-cols-2 gap-2"><InputNumber min={0} className="w-full" placeholder="Min" value={minPrice} onChange={(value) => setMinPrice(value ?? undefined)} /><InputNumber min={0} className="w-full" placeholder="Maks" value={maxPrice} onChange={(value) => setMaxPrice(value ?? undefined)} /></div></label><button type="button" onClick={() => setPremiumOnly((current) => !current)} className={`mt-5 w-full rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${premiumOnly ? 'border-premium bg-premium/10 text-premium' : 'border-line text-muted dark:border-line-dark'}`}>✨ Yalnız premium elanlar</button></aside><section className="min-w-0"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="market-section-label">{store.name}</p><h2 className="mt-1 font-display text-2xl font-bold text-ink dark:text-white">{store.name} təklifləri <span className="text-lg font-normal text-muted">({filtered.length})</span></h2></div><div className="flex gap-2"><button type="button" onClick={() => setPremiumOnly(false)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${!premiumOnly ? 'bg-action text-white' : 'bg-white text-muted dark:bg-graphite'}`}>Hamısı</button><button type="button" onClick={() => setPremiumOnly(true)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${premiumOnly ? 'bg-premium text-white' : 'bg-white text-muted dark:bg-graphite'}`}>Premium</button></div></div>{filtered.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{filtered.map((item) => <ListingCard key={item.id} listing={item} />)}</div> : <div className="rounded-2xl border border-[#e9ebef] bg-white py-20 dark:border-line-dark dark:bg-graphite"><Empty description="Bu filtrlərə uyğun elan tapılmadı" /></div>}</section></div>
  </div></main>;
}

function storeStatus(store: StoreType) {
  if (store.open24Hours) return { open: true, label: 'Açıqdır 24/7' };
  if (!store.workingDays?.length || !store.openingTime || !store.closingTime) return { open: true, label: 'Açıqdır' };
  const now = new Date();
  const day = WEEKDAY_KEYS[now.getDay()];
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const open = store.workingDays.includes(day) && current >= store.openingTime && current <= store.closingTime;
  return { open, label: open ? `Açıqdır ${store.closingTime}-dək` : `Bağlıdır — ${store.openingTime}-da açılır` };
}
