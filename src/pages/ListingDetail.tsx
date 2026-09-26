import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumb, Skeleton, Result, Avatar, message } from 'antd';
import {
  EnvironmentOutlined, PhoneOutlined, UserOutlined, StarFilled, WhatsAppOutlined, MessageOutlined,
  LeftOutlined, RightOutlined,
} from '@ant-design/icons';
import { useListing } from '@/hooks/useListing';
import { useListings } from '@/hooks/useListings';
import { getStoreById } from '@/hooks/useStore';
import RatingStars from '@/components/RatingStars';
import { ActiveViewersFull } from '@/components/ActiveViewers';
import ListingCard from '@/components/ListingCard';
import { getCategory, getSubcategory } from '@/config/categories';
import { formatDateTime, formatFullDateTime, formatPrice } from '@/utils/format';
import { useTranslation } from 'react-i18next';
import ImageWatermark from '@/components/ImageWatermark';
import { useAuth } from '@/context/AuthContext';
import { createListingPremiumPayment, LISTING_PREMIUM_AMOUNT, LISTING_PREMIUM_DAYS } from '@/utils/payment';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { listing, loading, error } = useListing(id);
  const { user } = useAuth();
  const [activeMedia, setActiveMedia] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [store, setStore] = useState<import('@/types').Store | null>(null);

  const { listings: similar } = useListings({ category: listing?.category, sort: 'newest' });

  useEffect(() => {
    let mounted = true;
    if (!listing?.storeId) { setStore(null); return () => { mounted = false; }; }
    void getStoreById(listing.storeId).then((result) => { if (mounted) setStore(result); }).catch(() => { if (mounted) setStore(null); });
    return () => { mounted = false; };
  }, [listing?.storeId]);

  const makePremium = async () => {
    if (!listing || !user || user.uid !== listing.ownerId) return;
    setPremiumLoading(true);
    const orderId = `${listing.id}-premium-${Date.now()}`;
    try {
      await updateDoc(doc(db, 'listings', listing.id), { premiumPaymentStatus: 'waiting', premiumPlan: 'top', premiumOrderId: orderId, updatedAt: Date.now() });
      const payment = await createListingPremiumPayment({ orderId, listingId: listing.id, amount: LISTING_PREMIUM_AMOUNT, plan: 'top', durationDays: LISTING_PREMIUM_DAYS });
      window.location.assign(payment.redirectUrl);
    } catch (paymentError) {
      message.error(paymentError instanceof Error ? paymentError.message : 'Premium ödənişi baş tutmadı.');
      setPremiumLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Skeleton.Image active className="!w-full !h-96" />
        <Skeleton active className="mt-6" />
      </div>
    );
  }

  if (error || !listing) {
    return <Result status="404" title="Elan tapılmadı" subTitle={error ?? undefined} extra={<Link to="/elanlar">Elanlara qayıt</Link>} />;
  }

  const category = getCategory(listing.category);
  const subcategory = getSubcategory(listing.category, listing.subcategory);
  const specFields = subcategory?.fields ?? [];
  const media = listing.media.length > 0 ? listing.media : [];
  const current = media[activeMedia];
  // Older listings do not have the WhatsApp fields, so use their phone number
  // as a backwards-compatible WhatsApp contact.
  const whatsappContact = listing.whatsappEnabled === false
    ? undefined
    : listing.whatsappPhone || listing.phone;

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 pb-28 md:pb-10">
      <Breadcrumb
        className="mb-4 text-sm"
        items={[
          { title: <Link to="/">Ana səhifə</Link> },
            { title: <Link to="/elanlar">{t('listings')}</Link> },
          { title: category?.label ?? listing.category },
          { title: listing.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        {/* GALLERY */}
        <div>
          <div
            className="group market-surface relative aspect-[4/3] bg-offwhite dark:bg-graphite overflow-hidden cursor-none"
          >
            {current ? (
              current.type === 'video' ? (
                <video src={current.url} controls className="w-full h-full object-contain" />
              ) : (
                <><img src={current.url} alt={listing.title} className="w-full h-full object-contain" /><ImageWatermark /></>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">Şəkil yoxdur</div>
            )}
            {media.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Əvvəlki şəkil"
                  onClick={() => setActiveMedia((index) => (index - 1 + media.length) % media.length)}
                  className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-lg text-white opacity-100 transition hover:bg-action focus:opacity-100"
                >
                  <LeftOutlined />
                </button>
                <button
                  type="button"
                  aria-label="Növbəti şəkil"
                  onClick={() => setActiveMedia((index) => (index + 1) % media.length)}
                  className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-lg text-white opacity-100 transition hover:bg-action focus:opacity-100"
                >
                  <RightOutlined />
                </button>
              </>
            )}
          </div>
          {media.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {media.map((m, i) => (
                <button
                  key={m.path}
                  onClick={() => setActiveMedia(i)}
                  className={`shrink-0 w-16 h-16 border ${i === activeMedia ? 'border-action' : 'border-line dark:border-line-dark'} overflow-hidden`}
                >
                  {m.type === 'video' ? (
                    <video src={m.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <div className="relative h-full w-full"><img src={m.url} alt="" className="w-full h-full object-cover" /><ImageWatermark /></div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* DESCRIPTION + SPECS */}
          <div className="market-surface mt-8 p-5 md:p-6">
            <div className="flex items-center gap-3 border-b border-line pb-3 dark:border-line-dark"><span className="h-6 w-1 rounded-full bg-[#FE6C2C]" /><h2 className="font-display text-lg font-bold text-ink dark:text-white">Təsvir</h2></div>
            <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-secondary dark:text-white/85">{listing.description || 'Bu elan üçün təsvir əlavə edilməyib.'}</p>
          </div>

          {specFields.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-bold text-ink dark:text-white mb-3">Xüsusiyyətlər</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line dark:border-line-dark pt-4">
                {specFields
                  .filter((f) => listing.attributes[f.name] !== undefined && listing.attributes[f.name] !== '')
                  .map((f) => (
                    <div key={f.name} className="flex justify-between border-b border-line dark:border-line-dark pb-2 text-sm">
                      <dt className="text-muted">{f.label}</dt>
                      <dd className="font-medium text-ink dark:text-white text-right">
                        {formatAttrValue(listing.attributes[f.name], f)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3"><h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white">{listing.title}</h1>{listing.isPremium && (!listing.premiumUntil || Number(listing.premiumUntil) > Date.now()) && <span className="rounded-full bg-premium px-3 py-1 text-xs font-bold text-white">✨ PREMIUM</span>}</div>
          <p className="mt-2 text-3xl font-bold text-[#16a34a] dark:text-[#4ade80]">
            {listing.priceHidden || listing.price == null ? 'Razılaşma yolu ilə' : formatPrice(listing.price)}
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1"><EnvironmentOutlined /> {listing.city}</span>
              <span title={formatDateTime(listing.createdAt)}>{t('added')}: {formatFullDateTime(listing.createdAt)}</span>
          </div>

          <div className="mt-4"><RatingStars listingId={listing.id} ratingAvg={listing.ratingAvg} ratingCount={listing.ratingCount} /></div>
          <div className="mt-3"><ActiveViewersFull listingId={listing.id} /></div>

          {/* SELLER */}
          <div className="market-surface mt-6 p-5">
            <div className="flex items-center gap-3">
              <Avatar size={44} icon={<UserOutlined />} className="bg-graphite" />
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted mb-0.5">{t('seller')}</p>
                <p className="font-semibold text-ink dark:text-white">{listing.ownerName}</p>
                <p className="text-xs text-muted inline-flex items-center gap-1">
                  <StarFilled className="text-action" /> {listing.ratingCount > 0 ? listing.ratingAvg.toFixed(1) : 'Yeni satıcı'}
                </p>
              </div>
            </div>
          
            <div className="mt-4">
              {user?.uid === listing.ownerId && !listing.isPremium && listing.status !== 'rejected' && <button type="button" disabled={premiumLoading} onClick={() => void makePremium()} className="mb-3 w-full rounded-lg border border-premium bg-premium/10 py-2.5 text-sm font-bold text-premium disabled:opacity-60">✨ {premiumLoading ? 'Ödəniş hazırlanır…' : `Elanı premium et — ${LISTING_PREMIUM_AMOUNT} AZN`}</button>}
              <button
                onClick={() => setShowPhone(true)}
                className="w-full bg-action text-white py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-85"
              >
                <PhoneOutlined /> {showPhone ? (listing.phone || '—') : t('showPhone')}
              </button>
              <Link
                to={`/mesajlar/${listing.id}`}
                className="mt-3 w-full bg-[#1677FF] text-white py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-85"
              >
                <MessageOutlined /> Mesaj yaz
              </Link>
              {whatsappContact && (
                <a
                  href={toWhatsAppUrl(whatsappContact)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 w-full bg-[#25D366] text-white py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-85"
                >
                  <WhatsAppOutlined /> WhatsApp
                </a>
              )}
            </div>
          </div>
          {store && <Link to={`/magaza/${store.slug}`} className="market-surface mt-4 flex items-center justify-between gap-3 p-4 transition hover:border-action"><div><p className="text-[11px] uppercase tracking-wide text-muted">Mağaza</p><p className="mt-1 font-semibold text-ink dark:text-white">{store.name}</p></div><span className="text-sm font-semibold text-action">Vitrinə bax →</span></Link>}
        </div>
      </div>

      {/* SIMILAR LISTINGS */}
      {similar.length > 1 && (
        <div className="mt-14">
          <h2 className="font-display text-xl font-bold text-ink dark:text-white mb-4">Oxşar elanlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similar.filter((l) => l.id !== listing.id).slice(0, 4).map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}

      {/* MOBILE STICKY ACTIONS — does not block the gallery */}
      <div className="md:hidden fixed bottom-16 inset-x-0 z-30 bg-paper dark:bg-offwhite border-t border-line dark:border-line-dark p-3">
        <button
          onClick={() => setShowPhone(true)}
          className="market-action w-full py-3"
        >
          <PhoneOutlined /> {showPhone ? (listing.phone || '—') : t('showPhone')}
        </button>
        <Link to={`/mesajlar/${listing.id}`} className="mt-2 market-action w-full py-3 !bg-[#1677FF] !text-white">
          <MessageOutlined /> Mesaj yaz
        </Link>
        {whatsappContact && (
          <a href={toWhatsAppUrl(whatsappContact)} target="_blank" rel="noreferrer" className="mt-2 market-action w-full py-3 !bg-[#25D366] !text-white">
            <WhatsAppOutlined /> WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

function toWhatsAppUrl(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `994${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

function formatAttrValue(value: unknown, field: { type: string; options?: { label: string; value: string }[] }): string {
  if (Array.isArray(value)) {
    if (field.options) {
      return value.map((v) => field.options!.find((o) => o.value === v)?.label ?? v).join(', ');
    }
    return value.join(', ');
  }
  if (typeof value === 'boolean') return value ? 'Bəli' : 'Xeyr';
  if (field.options) {
    return field.options.find((o) => o.value === value)?.label ?? String(value);
  }
  return String(value);
}
