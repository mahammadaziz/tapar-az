import { useEffect, useState } from 'react';
import { Alert, Button, Input, Select, Steps, message } from 'antd';
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
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [businessType, setBusinessType] = useState<'general' | 'individual'>('general');
  const [open24Hours, setOpen24Hours] = useState(false);
  const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');

  useEffect(() => {
    if (!store) return;
    setName(store.name); setDescription(store.description); setPhone(store.phone ?? ''); setCity(store.city ?? 'Bakı'); setAddress(store.address ?? ''); setCategory(store.category ?? ''); setLogoPreview(store.logoUrl ?? '');
    setBusinessType(store.businessType ?? 'general'); setOpen24Hours(Boolean(store.open24Hours)); setWorkingDays(store.workingDays?.length ? store.workingDays : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']); setOpeningTime(store.openingTime ?? '09:00'); setClosingTime(store.closingTime ?? '18:00');
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
        address: address.trim(),
        category: category || null,
        logoUrl,
        businessType,
        open24Hours,
        workingDays: open24Hours ? [] : workingDays,
        openingTime: open24Hours ? null : openingTime,
        closingTime: open24Hours ? null : closingTime,
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
  const nextStep = () => {
    if (step === 0 && (!name.trim() || !category)) { message.error('Mağaza adı və kateqoriya seçin.'); return; }
    if (step === 1 && !phone.trim()) { message.error('Mobil nömrə daxil edin.'); return; }
    if (step === 2 && !open24Hours && workingDays.length === 0) { message.error('Ən azı bir iş günü seçin.'); return; }
    setStep((current) => Math.min(3, current + 1));
  };
  return <main className="mx-auto max-w-3xl px-6 py-10 md:py-16">
    <div className="mb-8"><p className="market-section-label mb-2">TAPAR.AZ mağaza</p><h1 className="font-display text-3xl font-bold text-ink dark:text-white">{loading ? 'Mağaza yüklənir…' : store ? 'Mağazanı idarə et' : 'Öz mağazanı yarat'}</h1><p className="mt-2 text-sm text-muted">Elanlarınızı bir vitrində toplayın və alıcıların sizə daha asan güvənməsinə kömək edin.</p></div>
    <div className="market-surface space-y-7 p-6 md:p-8">
      <Steps current={step} responsive items={[{ title: 'Mağaza məlumatları' }, { title: 'Əlaqə və vitrin' }, { title: 'İş qrafiki' }, { title: 'Yoxlama və ödəniş' }]} />
      {step === 0 && <div className="space-y-5">
        <div><h2 className="font-display text-xl font-bold text-ink dark:text-white">Biznesiniz haqqında</h2><p className="mt-1 text-sm text-muted">Tap.az-dakı kimi əvvəlcə mağazanızın əsas məlumatlarını daxil edin.</p></div>
        <label className="block text-sm font-medium text-ink dark:text-white">Mağaza adı<Input className="mt-1.5" size="large" value={name} onChange={(event) => setName(event.target.value)} placeholder="Məs: Bakı Telefon Mərkəzi" /></label>
        <label className="block text-sm font-medium text-ink dark:text-white">Kateqoriya<Select allowClear size="large" className="mt-1.5 w-full" value={category || undefined} onChange={(value) => setCategory(value ?? '')} placeholder="Kateqoriya seçin" options={CATEGORIES.map((item) => ({ value: item.key, label: item.label }))} /></label>
      </div>}
      {step === 1 && <div className="space-y-5">
        <div><h2 className="font-display text-xl font-bold text-ink dark:text-white">Əlaqə və mağaza vitrini</h2><p className="mt-1 text-sm text-muted">Alıcıların sizi tanıması üçün əlaqə və vizual məlumatları tamamlayın.</p></div>
        <div className="grid gap-5 md:grid-cols-2"><label className="block text-sm font-medium text-ink dark:text-white">Mobil nömrə<Input className="mt-1.5" size="large" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+994 50 123 45 67" /></label><label className="block text-sm font-medium text-ink dark:text-white">Şəhər<Input className="mt-1.5" size="large" value={city} onChange={(event) => setCity(event.target.value)} /></label></div>
        <label className="block text-sm font-medium text-ink dark:text-white">Mağaza ünvanı<Input className="mt-1.5" size="large" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Məs: Bakı-Sumqayıt şossesi, mağaza 135" /></label>
        <label className="block text-sm font-medium text-ink dark:text-white">Mağaza haqqında<Input.TextArea className="mt-1.5" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Satdığınız məhsullar və xidmətlər haqqında qısa məlumat" /></label>
        <div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-action/10 text-3xl text-action">{logoPreview ? <img src={logoPreview} alt="Mağaza loqosu" className="h-full w-full object-cover" /> : '🏪'}</div><label className="text-sm font-medium text-ink dark:text-white">Mağaza loqosu<input className="mt-2 block w-full text-sm text-muted" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; setLogoFile(file); if (file) setLogoPreview(URL.createObjectURL(file)); }} /></label></div>
      </div>}
      {step === 2 && <div className="space-y-5">
        <div className="flex rounded-xl bg-offwhite p-1 dark:bg-background"><button type="button" onClick={() => setBusinessType('general')} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${businessType === 'general' ? 'bg-paper text-ink shadow-sm dark:bg-graphite dark:text-white' : 'text-muted'}`}>Ümumi</button><button type="button" onClick={() => setBusinessType('individual')} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${businessType === 'individual' ? 'bg-paper text-ink shadow-sm dark:bg-graphite dark:text-white' : 'text-muted'}`}>Fərdi</button></div>
        <div><h2 className="font-display text-xl font-bold text-ink dark:text-white">İş qrafiki</h2><p className="mt-1 text-sm text-muted">Mağazanızın alıcılar üçün açıq olduğu gün və saatları göstərin.</p></div>
        <div className="rounded-2xl border border-line p-5 dark:border-line-dark"><label className="flex items-center justify-between gap-4"><span><span className="block font-semibold text-ink dark:text-white">24/7 açıq</span><span className="mt-1 block text-sm text-muted">Mağaza bütün günlər fasiləsiz işləyir</span></span><input type="checkbox" checked={open24Hours} onChange={(event) => setOpen24Hours(event.target.checked)} className="h-5 w-5 accent-action" /></label><div className={`mt-7 space-y-6 ${open24Hours ? 'opacity-45' : ''}`}><div><p className="mb-3 font-semibold text-ink dark:text-white">İş günlərini seçin</p><div className="flex flex-wrap gap-2">{WORKING_DAYS.map((day) => <button key={day.value} type="button" disabled={open24Hours} onClick={() => setWorkingDays((current) => current.includes(day.value) ? current.filter((item) => item !== day.value) : [...current, day.value])} className={`rounded-full px-4 py-2 text-sm transition ${workingDays.includes(day.value) ? 'bg-action text-white' : 'bg-offwhite text-ink hover:bg-action/10 dark:bg-background dark:text-white'}`}>{day.label}</button>)}</div></div><div><p className="mb-3 font-semibold text-ink dark:text-white">İş saatları</p><div className="flex items-center gap-3"><select disabled={open24Hours} value={openingTime} onChange={(event) => setOpeningTime(event.target.value)} className="rounded-xl border-0 bg-offwhite px-4 py-3 text-sm text-ink outline-none dark:bg-background dark:text-white">{TIME_OPTIONS.map((time) => <option key={time}>{time}</option>)}</select><span className="text-muted">—</span><select disabled={open24Hours} value={closingTime} onChange={(event) => setClosingTime(event.target.value)} className="rounded-xl border-0 bg-offwhite px-4 py-3 text-sm text-ink outline-none dark:bg-background dark:text-white">{TIME_OPTIONS.map((time) => <option key={time}>{time}</option>)}</select></div></div></div></div>
        <Button type="link" className="!px-0" onClick={() => { setOpen24Hours(false); setWorkingDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']); setOpeningTime('09:00'); setClosingTime('18:00'); }}>Sıfırla</Button>
      </div>}
      {step === 3 && <div className="space-y-5">
        <div><h2 className="font-display text-xl font-bold text-ink dark:text-white">Məlumatları yoxlayın</h2><p className="mt-1 text-sm text-muted">Mağazanız ödənişdən sonra admin təsdiqinə göndəriləcək.</p></div>
        <div className="grid gap-3 sm:grid-cols-2"><Summary label="Mağaza adı" value={name} /><Summary label="Kateqoriya" value={CATEGORIES.find((item) => item.key === category)?.label ?? '—'} /><Summary label="Mobil nömrə" value={phone || '—'} /><Summary label="Şəhər" value={city || '—'} /></div>
      </div>}
      {step === 3 && (!store || store.status === 'waiting' || store.status === 'failed') && (
        <Alert
          type="warning"
          showIcon
          className="!border-2 !border-action !bg-action/10"
          message={<span className="text-lg font-bold text-ink dark:text-white">Mağaza yaratmaq üçün ödəniş tələb olunur</span>}
          description={<div className="mt-2 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-ink/75 dark:text-white/75">Ödənişdən sonra mağazanız admin təsdiqinə göndəriləcək.</span><strong className="text-3xl font-bold text-action">{PAYMENT_AMOUNT.toFixed(2)} AZN</strong></div>}
        />
      )}
      <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5 dark:border-line-dark"><Button disabled={step === 0 || saving} onClick={() => setStep((current) => Math.max(0, current - 1))}>Geri</Button>{step < 3 ? <Button type="primary" onClick={nextStep}>Davam et</Button> : <Button type="primary" size="large" loading={saving} onClick={() => void save()}>{(!store || store.status === 'waiting' || store.status === 'failed') ? `Ödəniş et və mağaza yarat — ${PAYMENT_AMOUNT.toFixed(2)} AZN` : 'Mağazanı yadda saxla'}</Button>}</div>
    </div>
  </main>;
}

const WORKING_DAYS = [
  { value: 'monday', label: 'Bazar ertəsi' }, { value: 'tuesday', label: 'Çərşənbə axşamı' },
  { value: 'wednesday', label: 'Çərşənbə' }, { value: 'thursday', label: 'Cümə axşamı' },
  { value: 'friday', label: 'Cümə' }, { value: 'saturday', label: 'Şənbə' }, { value: 'sunday', label: 'Bazar' },
];

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, '0');
  return `${hour}:${index % 2 ? '30' : '00'}`;
});

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-line p-4 dark:border-line-dark"><p className="text-xs text-muted">{label}</p><p className="mt-1 font-semibold text-ink dark:text-white">{value}</p></div>;
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
