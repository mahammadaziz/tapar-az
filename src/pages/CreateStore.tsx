import { useEffect, useState } from 'react';
import { Alert, Button, Input, Select, message } from 'antd';
import { collection, doc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '@/firebase/config';
import { CATEGORIES } from '@/config/categories';
import { useAuth } from '@/context/AuthContext';
import { storeSlug, useMyStore } from '@/hooks/useStore';
import { sendBrevoEmail } from '@/utils/email';
import { createStorePayment, PAYMENT_AMOUNT } from '@/utils/payment';

function createStoreId() {
  // Firestore document IDs may be UUIDs. crypto.randomUUID() generates a
  // standards-compliant UUID v4 in supported browsers.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  // Fallback for older browsers that do not expose crypto.randomUUID().
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export default function CreateStore() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { store, loading } = useMyStore(user?.uid);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bakı');
  const [category, setCategory] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    setName(store.name); setDescription(store.description); setPhone(store.phone ?? ''); setCity(store.city ?? 'Bakı'); setCategory(store.category ?? ''); setLogoPreview(store.logoUrl ?? '');
  }, [store]);

  if (!user) return null;
  const save = async () => {
    const cleanName = name.trim();
    const slug = storeSlug(cleanName);
    if (!cleanName || !slug) { message.error('Mağaza adı daxil edin.'); return; }
    setSaving(true);
    try {
      // Keep the existing document ID when editing. For a new store, the
      // frontend owns the ID and creates a UUID v4 for stores/{storeId}.
      const id = store?.id ?? createStoreId();
      let logoUrl = store?.logoUrl ?? '';
      if (logoFile) {
        const logoRef = ref(storage, `stores/${user.uid}/${id}/logo-${Date.now()}-${logoFile.name}`);
        await uploadBytes(logoRef, logoFile, { contentType: logoFile.type });
        logoUrl = await getDownloadURL(logoRef);
      }
      const storeRef = doc(db, 'stores', id);
      const storeData = {
        name: cleanName,
        slug,
        description: description.trim(),
        phone: phone.trim(),
        city: city.trim(),
        category: category || null,
        logoUrl,
        updatedAt: serverTimestamp(),
      };
      // Stores created before this payment flow have no status field; keep
      // their existing edit behaviour instead of charging them again.
      const isPaidStore = Boolean(store && (!store.status || store.status === 'success'));

      // Existing paid stores can be edited normally. A new store, or a store
      // whose payment is still waiting/failed, must go through payment first.
      if (store && isPaidStore) {
        await updateDoc(storeRef, storeData);
        message.success('Mağaza yeniləndi.');
        navigate(`/magaza/${slug}`);
        return;
      }

      const isNewStore = !store;
      if (isNewStore) {
        await setDoc(storeRef, {
          ...storeData,
          ownerId: user.uid,
          ownerEmail: user.email ?? '',
          verified: false,
          status: 'waiting',
          paymentStatus: 'waiting',
          adminStatus: 'waiting',
          orderId: id,
          amount: PAYMENT_AMOUNT,
          price: PAYMENT_AMOUNT,
          subscriptionName: cleanName,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(storeRef, { ...storeData, subscriptionName: cleanName, updatedAt: serverTimestamp() });
      }

      if (isNewStore) await notifyStoreAdmins(cleanName, id, user.email ?? '');

      const payment = await createStorePayment({
        orderId: id,
        storeId: id,
        amount: PAYMENT_AMOUNT,
        price: PAYMENT_AMOUNT,
        subscriptionName: cleanName,
      });
      // The backend/Epoint callback will update this stores/{id} document to
      // status=success. The public store list only shows approved paid stores.
      window.location.assign(payment.redirectUrl);
    } catch (error) { message.error(error instanceof Error ? error.message : 'Mağazanı yadda saxlamaq olmadı.'); }
    finally { setSaving(false); }
  };
  return <main className="mx-auto max-w-3xl px-6 py-10 md:py-16">
    <div className="mb-8"><p className="market-section-label mb-2">TAPAR.AZ mağaza</p><h1 className="font-display text-3xl font-bold text-ink dark:text-white">{loading ? 'Mağaza yüklənir…' : store ? 'Mağazanı idarə et' : 'Öz mağazanı yarat'}</h1><p className="mt-2 text-sm text-muted">Elanlarınızı bir vitrində toplayın və alıcıların sizə daha asan güvənməsinə kömək edin.</p></div>
    <div className="market-surface space-y-5 p-6 md:p-8">
      {(!store || store.status === 'waiting' || store.status === 'failed') && (
        <Alert
          type="warning"
          showIcon
          className="!border-2 !border-action !bg-action/10"
          message={<span className="text-lg font-bold text-ink dark:text-white">Mağaza yaratmaq üçün ödəniş tələb olunur</span>}
          description={<div className="mt-2 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-ink/75 dark:text-white/75">Ödənişdən sonra mağazanız admin təsdiqinə göndəriləcək.</span><strong className="text-3xl font-bold text-action">{PAYMENT_AMOUNT.toFixed(2)} AZN</strong></div>}
        />
      )}
      <div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-action/10 text-3xl text-action">{logoPreview ? <img src={logoPreview} alt="Mağaza loqosu" className="h-full w-full object-cover" /> : '🏪'}</div><label className="text-sm font-medium text-ink dark:text-white">Mağaza profil şəkli<input className="mt-2 block w-full text-sm text-muted" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; setLogoFile(file); if (file) setLogoPreview(URL.createObjectURL(file)); }} /></label></div>
      <label className="block text-sm font-medium text-ink dark:text-white">Mağaza adı<Input className="mt-1.5" size="large" value={name} onChange={(event) => setName(event.target.value)} placeholder="Məs: Bakı Telefon Mərkəzi" /></label>
      <label className="block text-sm font-medium text-ink dark:text-white">Haqqında<Input.TextArea className="mt-1.5" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mağazanız və satdığınız məhsullar haqqında qısa məlumat" /></label>
      <div className="grid gap-5 md:grid-cols-3"><label className="block text-sm font-medium text-ink dark:text-white">Telefon<Input className="mt-1.5" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+994 50 123 45 67" /></label><label className="block text-sm font-medium text-ink dark:text-white">Şəhər<Input className="mt-1.5" value={city} onChange={(event) => setCity(event.target.value)} /></label><label className="block text-sm font-medium text-ink dark:text-white">Kateqoriya<Select allowClear className="mt-1.5 w-full" value={category || undefined} onChange={(value) => setCategory(value ?? '')} placeholder="Seçin" options={CATEGORIES.map((item) => ({ value: item.key, label: item.label }))} /></label></div>
      <Button type="primary" size="large" loading={saving} onClick={() => void save()}>{(!store || store.status === 'waiting' || store.status === 'failed') ? `Ödəniş et və mağaza yarat — ${PAYMENT_AMOUNT.toFixed(2)} AZN` : 'Mağazanı yadda saxla'}</Button>
    </div>
  </main>;
}

async function notifyStoreAdmins(storeName: string, storeId: string, ownerEmail: string) {
  const recipients = new Set<string>();
  const configured = ((import.meta.env.VITE_BREVO_ADMIN_EMAILS as string | undefined) || '')
    .split(',').map((email) => email.trim().toLowerCase()).filter((email) => email.includes('@'));
  configured.forEach((email) => recipients.add(email));
  try {
    const snapshot = await getDocs(collection(db, 'tapar_admins'));
    snapshot.docs.forEach((item) => {
      const data = item.data() as { email?: string; active?: boolean };
      if (data.active !== false && data.email?.includes('@')) recipients.add(data.email.trim().toLowerCase());
    });
  } catch {
    // Configured recipients are enough if Firestore admin listing is blocked.
  }
  if (!recipients.size) return;
  const adminLink = `${window.location.origin}/admin/stores`;
  await Promise.allSettled([...recipients].map((email) => sendBrevoEmail({
    to: email,
    subject: 'Yeni mağaza ödəniş və təsdiq gözləyir — TAPAR.AZ',
    text: `Yeni mağaza yaradılıb: ${storeName}. Ödəniş və admin təsdiqi gözlənilir. Store ID: ${storeId}. Sahibi: ${ownerEmail || 'email yoxdur'}. Admin panel: ${adminLink}`,
    html: `<p>Yeni mağaza yaradılıb: <strong>${storeName}</strong></p><p>Ödəniş və admin təsdiqi gözlənilir.</p><p>Store ID: ${storeId}</p><p>Sahibi: ${ownerEmail || 'email yoxdur'}</p><p><a href="${adminLink}">Admin paneldə bax</a></p>`,
  })));
}
