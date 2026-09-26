import { useState } from 'react';
import { Avatar, Input, Button, message, Tag } from 'antd';
import { CrownFilled, UserOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime } from '@/utils/format';
import { useMyListings } from '@/hooks/useMyListings';
import { createListingPremiumPayment, LISTING_PREMIUM_AMOUNT, LISTING_PREMIUM_DAYS } from '@/utils/payment';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Listing } from '@/types';

export default function Profile() {
  const { user, profile, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const { listings, loading: listingsLoading } = useMyListings();
  const [premiumLoading, setPremiumLoading] = useState<string | null>(null);

  if (!user) return null;

  const makePremium = async (listing: Listing) => {
    setPremiumLoading(listing.id);
    const orderId = `${listing.id}-premium-${Date.now()}`;
    try {
      await updateDoc(doc(db, 'listings', listing.id), { premiumPaymentStatus: 'waiting', premiumPlan: 'top', premiumOrderId: orderId, updatedAt: Date.now() });
      const payment = await createListingPremiumPayment({ orderId, listingId: listing.id, amount: LISTING_PREMIUM_AMOUNT, plan: 'top', durationDays: LISTING_PREMIUM_DAYS });
      window.location.assign(payment.redirectUrl);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Premium ödənişi baş tutmadı.');
    } finally { setPremiumLoading(null); }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="market-surface flex items-center gap-4 mb-8 p-5">
        <Avatar size={64} src={profile?.photoURL} icon={<UserOutlined />} className="bg-graphite" />
        <div>
          <h1 className="font-display text-xl font-bold text-ink dark:text-white">{profile?.displayName ?? user.displayName}</h1>
          <p className="text-sm text-muted">{profile?.email ?? user.email}</p>
        </div>
      </div>
      <div className="max-w-xl grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="market-surface md:col-span-2 p-5 space-y-4">
          <div><label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Ad Soyad</label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
          <div><label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">Telefon</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+994 50 123 45 67" /></div>
          <Button type="primary" loading={saving} onClick={async () => {
            setSaving(true);
            try { await updateUserProfile(displayName, phone); message.success('Şəxsi məlumatlar yeniləndi.'); }
            catch (error) { message.error(error instanceof Error ? error.message : 'Məlumatları yeniləmək mümkün olmadı.'); }
            finally { setSaving(false); }
          }}>Məlumatları yadda saxla</Button>
        </div>
        <InfoRow label="Email" value={profile?.email ?? user.email ?? '—'} hint="Email dəyişdirilə bilməz" />
        <InfoRow label="Qeydiyyat tarixi" value={formatDateTime(profile?.createdAt)} />
      </div>
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="market-section-label">Satış idarəetməsi</p><h2 className="mt-1 font-display text-2xl font-bold text-ink dark:text-white">Mənim elanlarım</h2></div><span className="text-sm text-muted">{listings.length} elan</span></div>
        {listingsLoading ? <div className="market-surface p-6 text-sm text-muted">Elanlar yüklənir…</div> : listings.length === 0 ? <div className="market-surface p-6 text-sm text-muted">Hələ elan yerləşdirməmisiniz.</div> : <div className="space-y-3">{listings.map((listing) => {
          const activePremium = Boolean(listing.isPremium && (!listing.premiumUntil || Number(listing.premiumUntil) > Date.now()));
          return <div key={listing.id} className="market-surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-semibold text-ink dark:text-white">{listing.title}</p><div className="mt-1 flex items-center gap-2 text-xs text-muted"><span>{listing.status === 'active' ? 'Aktiv' : listing.status === 'pending' ? 'Yoxlamada' : listing.status}</span>{activePremium && <Tag color="gold" icon={<CrownFilled />}>Premium</Tag>}</div></div>{activePremium ? <span className="text-xs font-semibold text-premium">Premium aktivdir</span> : listing.status === 'active' ? <Button size="small" loading={premiumLoading === listing.id} onClick={() => void makePremium(listing)} icon={<CrownFilled />}>Premium et — {LISTING_PREMIUM_AMOUNT} AZN</Button> : <span className="text-xs text-muted">Aktiv olduqdan sonra premium edə bilərsiniz</span>}</div>;
        })}</div>}
      </section>
    </div>
  );
}

function InfoRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="border border-line dark:border-line-dark p-4"><span className="text-xs text-muted block">{label}</span><span className="font-medium text-ink dark:text-white block mt-1 break-all">{value}</span>{hint && <span className="text-[11px] text-muted block mt-1">{hint}</span>}</div>;
}
