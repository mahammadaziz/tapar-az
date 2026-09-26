import { useEffect, useState } from 'react';
import { Alert, Button, Carousel, Empty, Modal, Spin, Table, Tag, message } from 'antd';
import { CheckOutlined, CloseOutlined, EnvironmentOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';
import type { Listing } from '@/types';
import AdminAccess from './AdminAccess';
import { sendBrevoEmail } from '@/utils/email';
import { listingEmailCard } from '@/utils/emailTemplates';

export default function AdminListings() {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [selected, setSelected] = useState<Listing | null>(null);
  const sortedItems = [...items].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'listings'), where('status', '==', 'pending')));
      setItems(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Listing));
    } catch (error) { message.error(error instanceof Error ? error.message : 'Elanlar yüklənmədi.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);

  const review = async (listing: Listing, approved: boolean) => {
    if (!user || !listing.ownerEmail) { message.error('Elan sahibinin email ünvanı yoxdur.'); return; }
    setWorking(listing.id);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'listings', listing.id), { status: approved ? 'active' : 'rejected', reviewedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      const videoSnapshot = await getDocs(query(collection(db, 'short_videos'), where('listingId', '==', listing.id)));
      videoSnapshot.docs.forEach((video) => batch.update(video.ref, { status: approved ? 'active' : 'rejected', updatedAt: serverTimestamp() }));
      const link = `${window.location.origin}/elanlar/${listing.id}`;
      await batch.commit();
      try {
        const link = `${window.location.origin}/elanlar/${listing.id}`;
        await sendBrevoEmail({
          to: listing.ownerEmail,
          subject: approved ? 'Elanınız aktivdir — TAPAR.AZ' : 'Elanınız təsdiqlənmədi — TAPAR.AZ',
          text: approved ? `Salam ${listing.ownerName}, elanınız aktivdir. Elana baxın: ${link}` : `Salam ${listing.ownerName}, elanınız təsdiqlənmədi. Məlumatları düzəldib yenidən yerləşdirə bilərsiniz.`,
          html: listingEmailCard({ ...listing, link }, approved ? 'Elanınız admin tərəfindən təsdiqləndi və artıq aktivdir.' : 'Elanınız admin yoxlamasından keçmədi. Məlumatları düzəldib yenidən yerləşdirə bilərsiniz.'),
        });
      } catch { message.warning('Elan statusu dəyişdi, lakin user email-i göndərilmədi.'); }
      setItems((current) => current.filter((item) => item.id !== listing.id));
      setSelected(null);
      message.success(approved ? 'Elan təsdiqləndi və email göndərişinə əlavə edildi.' : 'Elan rədd edildi və istifadəçiyə email əlavə edildi.');
    } catch (error) { message.error(error instanceof Error ? error.message : 'Əməliyyat baş tutmadı.'); }
    finally { setWorking(null); }
  };

  if (!isAdmin) return <AdminAccess />;
  if (!user) return null;

  return <div className="max-w-[1400px] mx-auto py-3">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
      <div><p className="market-section-label">Elan moderasiyası</p><h1 className="font-display text-3xl font-bold text-ink dark:text-white mt-2">Təsdiq gözləyən elanlar</h1><p className="text-sm text-muted mt-2">Elanı və paylaşanın bütün məlumatlarını yoxlayın.</p></div>
      <div className="rounded-xl border border-line dark:border-line-dark bg-paper dark:bg-graphite px-4 py-3 text-sm"><span className="text-muted">Gözləyən elan:</span> <strong className="text-action ml-1">{items.length}</strong></div>
    </div>
    <Alert className="mb-7" type="info" showIcon message="Approve və decline etdikdə paylaşanın email ünvanına avtomatik bildiriş növbəyə əlavə olunur." />
    {loading ? <div className="flex justify-center py-20"><Spin size="large" /></div> : items.length === 0 ? <div className="market-surface py-20"><Empty description="Təsdiq gözləyən elan yoxdur" /></div> : <div className="market-surface overflow-hidden"><Table<Listing> rowKey="id" dataSource={sortedItems} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1050 }} columns={[
      { title: 'Media', key: 'media', width: 150, render: (_, listing) => <div className="w-32 h-24 overflow-hidden rounded-lg border border-line bg-offwhite"><MediaGallery listing={listing} compact /></div> },
      { title: 'Elan', key: 'listing', width: 270, render: (_, listing) => <div><p className="font-semibold text-ink dark:text-white">{listing.title}</p><p className="text-xs text-muted mt-1">{listing.category} · {listing.subcategory}</p><p className="text-xs text-muted mt-2 line-clamp-2">{listing.description}</p></div> },
      { title: 'Paylaşan', key: 'owner', width: 220, render: (_, listing) => <div><p className="text-sm font-medium text-ink dark:text-white">{listing.ownerName}</p><p className="text-xs text-muted break-all mt-1">{listing.ownerEmail || 'Email yoxdur'}</p><p className="text-xs text-muted mt-1">{listing.phone || 'Telefon yoxdur'}</p></div> },
      { title: 'Məlumat', key: 'info', width: 160, render: (_, listing) => <div><p className="text-sm text-ink dark:text-white">{listing.city}</p><p className="text-sm font-semibold text-action mt-1">{listing.price == null ? 'Razılaşma' : `${listing.price} AZN`}</p><p className="text-xs text-muted mt-2">{formatDate(listing.createdAt)}</p></div> },
      { title: 'Əməliyyat', key: 'actions', fixed: 'right' as const, width: 245, render: (_, listing) => <div className="flex flex-wrap gap-2"><Button size="small" onClick={() => setSelected(listing)}>Ətraflı</Button><Button size="small" type="primary" loading={working === listing.id} onClick={() => void review(listing, true)}>Təsdiqlə</Button><Button size="small" danger loading={working === listing.id} onClick={() => void review(listing, false)}>Rədd et</Button></div> },
    ]} /></div>}
    <ListingDetails listing={selected} onClose={() => setSelected(null)} onApprove={() => selected && void review(selected, true)} onDecline={() => selected && void review(selected, false)} working={Boolean(selected && working === selected.id)} />
  </div>;
}

function ListingReviewCard({ listing, working, onDetails, onApprove, onDecline }: { listing: Listing; working: boolean; onDetails: () => void; onApprove: () => void; onDecline: () => void }) {
  return <article className="market-surface overflow-hidden">
    <MediaGallery listing={listing} compact />
    <div className="p-5">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted uppercase tracking-wide">{listing.category} · {listing.subcategory}</p><h2 className="font-display text-xl font-bold text-ink dark:text-white mt-1 break-words">{listing.title}</h2></div><Tag color="gold">Gözləyir</Tag></div>
      <p className="text-sm text-muted mt-3 line-clamp-3 whitespace-pre-line">{listing.description}</p>
      <div className="grid grid-cols-2 gap-3 mt-5 text-sm"><Info icon={<EnvironmentOutlined />} label="Yer" value={listing.city} /><Info icon={<UserOutlined />} label="Paylaşan" value={listing.ownerName} /><Info icon={<MailOutlined />} label="Email" value={listing.ownerEmail || '—'} /><Info icon={<PhoneOutlined />} label="Telefon" value={listing.phone || '—'} /></div>
      <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-5 border-t border-line dark:border-line-dark"><Button className="flex-1" onClick={onDetails}>Ətraflı bax</Button><Button className="flex-1" type="primary" icon={<CheckOutlined />} loading={working} onClick={onApprove}>Təsdiqlə</Button><Button className="flex-1" danger icon={<CloseOutlined />} loading={working} onClick={onDecline}>Rədd et</Button></div>
    </div>
  </article>;
}

function MediaGallery({ listing, compact = false }: { listing: Listing; compact?: boolean }) {
  const height = compact ? 'h-24' : 'h-40';
  return <div className={`${height} w-full bg-offwhite dark:bg-graphite [&_.slick-arrow]:z-10 [&_.slick-arrow]:!text-white [&_.slick-arrow]:!bg-black/50 [&_.slick-arrow]:rounded-full [&_.slick-dots]:!bottom-4`}>
    {listing.media?.length ? <Carousel arrows infinite dots={listing.media.length > 1} className={height}>{listing.media.map((media, index) => <div key={media.path || `${listing.id}-${index}`} className={height}><div className="relative h-full w-full">{media.type === 'video' ? <video src={media.url} controls className="w-full h-full object-contain bg-black/5" /> : <img src={media.url} alt={`${listing.title} ${index + 1}`} className="w-full h-full object-contain" />}<span className="absolute right-4 bottom-10 rounded-md bg-black/70 px-2.5 py-1 text-xs text-white">{index + 1} / {listing.media.length}</span></div></div>)}</Carousel> : <div className="h-full flex items-center justify-center text-sm text-muted">Media əlavə edilməyib</div>}
  </div>;
}

function ListingDetails({ listing, onClose, onApprove, onDecline, working }: { listing: Listing | null; onClose: () => void; onApprove: () => void; onDecline: () => void; working: boolean }) {
  return <Modal open={Boolean(listing)} onCancel={onClose} footer={null} width={900} title={<span className="font-display text-xl">Elanın tam detalları</span>} destroyOnClose>{listing && <div className="space-y-5"><MediaGallery listing={listing} /><div><h2 className="font-display text-2xl font-bold text-ink dark:text-white">{listing.title}</h2><p className="text-sm text-muted mt-2">{listing.description}</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[['Kateqoriya', listing.category], ['Alt kateqoriya', listing.subcategory], ['Qiymət', listing.price == null ? 'Razılaşma yolu ilə' : `${listing.price} AZN`], ['Şəhər', listing.city], ['Telefon', listing.phone || '—'], ['Ünvan', listing.address || '—'], ['Paylaşan', listing.ownerName], ['Email', listing.ownerEmail || '—']].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-line dark:border-line-dark p-3"><p className="text-xs text-muted">{label}</p><p className="text-sm font-medium text-ink dark:text-white mt-1 break-words">{value}</p></div>)}</div>{Object.keys(listing.attributes || {}).length > 0 && <div><h3 className="font-semibold text-ink dark:text-white mb-3">Kateqoriya xüsusiyyətləri</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{Object.entries(listing.attributes).map(([key, value]) => <div key={key} className="rounded-lg bg-offwhite dark:bg-graphite p-3"><p className="text-xs text-muted">{key}</p><p className="text-sm text-ink dark:text-white mt-1">{Array.isArray(value) ? value.join(', ') : String(value ?? '—')}</p></div>)}</div></div>}<div className="flex flex-col sm:flex-row justify-end gap-2 border-t border-line dark:border-line-dark pt-5"><Button onClick={onClose}>Bağla</Button><Button danger icon={<CloseOutlined />} loading={working} onClick={onDecline}>Rədd et</Button><Button type="primary" icon={<CheckOutlined />} loading={working} onClick={onApprove}>Təsdiqlə və email göndər</Button></div></div>}</Modal>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="min-w-0"><p className="text-xs text-muted flex items-center gap-1">{icon}{label}</p><p className="text-sm font-medium text-ink dark:text-white truncate mt-1">{value}</p></div>; }

function toMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: () => number }).toMillis === 'function') return (value as { toMillis: () => number }).toMillis();
  return 0;
}

function formatDate(value: unknown): string {
  const millis = toMillis(value);
  return millis ? new Intl.DateTimeFormat('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(millis) : 'Tarix gözlənilir';
}
