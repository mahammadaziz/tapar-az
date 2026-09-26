import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Steps, Input, InputNumber, Select, Button, Switch, message, Alert, Modal, Tag, Card } from 'antd';
import { doc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES, categoryLabel, getCategory, subcategoryLabel } from '@/config/categories';
import { useLanguage } from '@/context/LanguageContext';
import { AZERBAIJAN_LOCATIONS } from '@/config/locations';
import DynamicForm from '@/components/DynamicForm';
import MediaUploader from '@/components/MediaUploader';
import { pruneHiddenValues } from '@/utils/conditionalFields';
import { useAIListing } from '@/hooks/useAIListing';
import type { CategoryKey, ListingAttributes, MediaItem } from '@/types';
import { formatPrice } from '@/utils/format';
import { createListingPremiumPayment, LISTING_PREMIUM_AMOUNT, LISTING_PREMIUM_DAYS } from '@/utils/payment';
import { sendBrevoEmail } from '@/utils/email';
import { listingEmailCard } from '@/utils/emailTemplates';
import { useMyStore } from '@/hooks/useStore';

const { TextArea } = Input;

const STEP_LABELS = ['Kateqoriya', 'Alt kateqoriya', 'Məlumatlar', 'Media', 'AI yoxlanışı', 'Önizləmə', 'Dərc et'];

export default function CreateListing() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const { store, loading: storeLoading } = useMyStore(user?.uid);
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as { aiDraft?: import('@/types').AIListingDraft } | null)?.aiDraft;

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CategoryKey | undefined>(prefill?.category ?? undefined);
  const [subcategory, setSubcategory] = useState<string | undefined>(prefill?.subcategory ?? undefined);

  const [title, setTitle] = useState(prefill?.title ?? '');
  const [price, setPrice] = useState<number | undefined>(prefill?.price ?? undefined);
  const [priceHidden, setPriceHidden] = useState(false);
  const [city, setCity] = useState<string | undefined>(prefill?.city ?? undefined);
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [attributes, setAttributes] = useState<ListingAttributes>(prefill?.attributes ?? {});
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAssisted, setAiAssisted] = useState(Boolean(prefill));
  const [premiumPlan, setPremiumPlan] = useState<'top' | 'urgent' | 'vip' | null>(null);

  useEffect(() => {
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [profile?.phone, phone]);

  // A stable draft id used for storage paths before the Firestore doc exists
  const draftId = useMemo(() => doc(collection(db, 'listings')).id, []);

  const { draft, loading: aiLoading, unavailable, generate, improve } = useAIListing();
  const [aiInput, setAiInput] = useState('');

  const categoryConfig = getCategory(category);
  const subConfig = categoryConfig?.subcategories.find((s) => s.key === subcategory);

  const canProceedFrom = (s: number): boolean => {
    switch (s) {
      case 0: return Boolean(category);
      case 1: return Boolean(subcategory);
      case 2: return Boolean(title && city && phone.trim() && description && (!whatsappEnabled || whatsappPhone.trim()));
      default: return true;
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const applyAIDraft = (incoming = draft) => {
    if (!incoming) return;
    if (incoming.title) setTitle(incoming.title);
    if (incoming.description) setDescription(incoming.description);
    if (incoming.price != null) setPrice(incoming.price);
    if (incoming.city) setCity(incoming.city);
    if (incoming.phone) setPhone(incoming.phone);
    if (incoming.address) setAddress(incoming.address);
    if (incoming.category && incoming.category === category) setCategory(incoming.category);
    if (incoming.subcategory && incoming.subcategory === subcategory) setSubcategory(incoming.subcategory);
    const allowedAttributes = subConfig
      ? Object.fromEntries(Object.entries(incoming.attributes).filter(([name]) => subConfig.fields.some((field) => field.name === name)))
      : incoming.attributes;
    setAttributes((prev) => ({ ...prev, ...allowedAttributes }));
    setAiAssisted(true);
    message.success('AI təklifi tətbiq olundu — məlumatları yoxlayın.');
  };

  const handleImproveDescription = async () => {
    const improved = await improve(description, category ?? null);
    if (improved) setDescription(improved);
  };

  const handlePublish = async () => {
    if (!user) { message.error('Zəhmət olmasa daxil olun.'); return; }
    if (storeLoading) { message.info('Mağaza məlumatları yüklənir, zəhmət olmasa bir az gözləyin.'); return; }
    if (!category || !subcategory || !title || !city || !phone.trim() || (whatsappEnabled && !whatsappPhone.trim())) { message.error('Telefon nömrəsi daxil olmaqla bütün tələb olunan sahələri doldurun.'); return; }

    setPublishing(true);
    try {
      const cleanedAttrs = subConfig ? pruneHiddenValues(subConfig.fields, attributes) : attributes;
      const ref = doc(db, 'listings', draftId);
      const listingData = {
        ownerId: user.uid,
        ownerName: profile?.displayName ?? user.displayName ?? 'İstifadəçi',
        ownerEmail: user.email ?? profile?.email ?? '',
        ...(store?.id ? { storeId: store.id } : {}),
        category, subcategory, title,
        price: priceHidden ? null : price ?? null,
        priceHidden,
        currency: 'AZN',
        city, phone: phone.trim(), whatsappEnabled, ...(whatsappEnabled && whatsappPhone.trim() ? { whatsappPhone: whatsappPhone.trim() } : {}), address, description,
        media,
        attributes: cleanedAttrs,
        status: 'pending',
        viewCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
        aiAssisted,
        ...(premiumPlan ? { premiumPaymentStatus: 'waiting', premiumPlan, premiumAmount: LISTING_PREMIUM_AMOUNT } : {}),
      };
      const batch = writeBatch(db);
      batch.set(ref, listingData);
      await batch.commit();
      if (premiumPlan) {
        try {
          const payment = await createListingPremiumPayment({
            orderId: `${draftId}-premium-${Date.now()}`,
            listingId: draftId,
            amount: LISTING_PREMIUM_AMOUNT,
            plan: premiumPlan,
            durationDays: LISTING_PREMIUM_DAYS,
          });
          window.location.assign(payment.redirectUrl);
          return;
        } catch (error) {
          message.warning(error instanceof Error ? `${error.message} Elanınız premium olmadan yadda saxlanıldı.` : 'Premium ödənişi baş tutmadı. Elanınız yadda saxlanıldı.');
        }
      }
      let collectionAdminEmails: string[] = [];
      try {
        const adminsSnapshot = await getDocs(collection(db, 'tapar_admins'));
        collectionAdminEmails = adminsSnapshot.docs
          .map((admin) => admin.data() as { email?: string; active?: boolean })
          .filter((admin) => admin.active !== false && admin.email?.includes('@'))
          .map((admin) => admin.email!.trim().toLowerCase());
      } catch (error) {
        console.warn('Admin email list could not be loaded; using configured recipients.', error);
      }
      const configuredAdminEmails = ((import.meta.env.VITE_BREVO_ADMIN_EMAILS as string | undefined) || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.includes('@'));
      const notificationRecipients = [...new Set([...collectionAdminEmails, ...configuredAdminEmails])];
      if (notificationRecipients.length) {
        const adminLink = `${window.location.origin}/admin/elanlar`;
        const emailResult = await Promise.allSettled(notificationRecipients.map((adminEmail) => sendBrevoEmail({
          to: adminEmail,
          subject: 'Yeni elan təsdiq gözləyir — TAPAR.AZ',
          text: `Yeni elan daxil edildi: ${title}. Admin panelə daxil olub yoxlayın: ${adminLink}`,
          html: listingEmailCard({ title, description, category: categoryConfig?.label, city, price: priceHidden ? null : price, media, link: adminLink, ownerName: profile?.displayName ?? user.displayName ?? 'İstifadəçi', ownerEmail: user.email ?? profile?.email ?? '' }, 'Yeni elan daxil edildi. Zəhmət olmasa admin panelə daxil olub yoxlayın.'),
        })));
        if (emailResult.some((result) => result.status === 'rejected')) message.warning('Elan yadda saxlanıldı, lakin bəzi admin email-ləri göndərilmədi.');
      }
      message.success('Elanınız admin təsdiqinə göndərildi. Təsdiqdən sonra aktiv olacaq.');
      navigate(`/elanlar/${draftId}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Elan dərc edilərkən xəta baş verdi.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white mb-6">Elan yerləşdir</h1>

      <Steps current={step} size="small" items={STEP_LABELS.map((label) => ({ title: label }))} className="mb-10 hidden md:flex" />
      <p className="md:hidden text-sm text-muted mb-6">Addım {step + 1} / {STEP_LABELS.length}: {STEP_LABELS[step]}</p>

      {/* STEP 0: CATEGORY */}
      {step === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => { setCategory(c.key); setSubcategory(undefined); }}
              className={`market-surface p-6 text-left transition-all ${category === c.key ? 'border-action bg-action/10' : 'hover:border-action hover:-translate-y-0.5'}`}
            >
              <p className="font-semibold text-ink dark:text-white">{categoryLabel(c.key, language)}</p>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1: SUBCATEGORY */}
      {step === 1 && categoryConfig && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categoryConfig.subcategories.map((s) => (
            <button
              key={s.key}
              onClick={() => setSubcategory(s.key)}
              className={`market-surface p-6 text-left transition-all ${subcategory === s.key ? 'border-action bg-action/10' : 'hover:border-action hover:-translate-y-0.5'}`}
            >
              <p className="font-semibold text-ink dark:text-white">{subcategoryLabel(s.key, language)}</p>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2: UNIVERSAL + CATEGORY-SPECIFIC FIELDS */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="rounded-xl border border-action/30 bg-action/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-semibold text-ink dark:text-white">Bütün məlumatları AI ilə doldur</p><p className="text-xs text-muted mt-1">Prompt-u yazın, uyğun sahələr avtomatik doldurulsun.</p></div>
              <Button type="primary" onClick={() => setAiModalOpen(true)}>✨ AI ilə doldur</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div className="sm:col-span-2">
              <FieldLabel required>Başlıq</FieldLabel>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Elanın başlığı" />
            </div>
            <div>
              <FieldLabel>Qiymət (AZN)</FieldLabel>
              <InputNumber className="w-full" value={price} onChange={(v) => setPrice(v ?? undefined)} disabled={priceHidden} min={0} />
              <label className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                <Switch size="small" checked={priceHidden} onChange={setPriceHidden} /> Qiyməti gizlət (razılaşma yolu ilə)
              </label>
            </div>
            <div>
              <FieldLabel required>Şəhər</FieldLabel>
              <Select showSearch optionFilterProp="label" className="w-full" value={city} onChange={setCity} options={AZERBAIJAN_LOCATIONS.map((c) => ({ label: c, value: c }))} placeholder="Şəhər və ya rayon seçin" />
            </div>
            <div>
              <FieldLabel required>Telefon nömrəsi</FieldLabel>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Məs: +994 50 123 45 67"
                inputMode="tel"
              />
              <p className="mt-1 text-xs text-muted">Alıcılar bu nömrəni “Telefonu göstər” düyməsi ilə görəcək.</p>
            </div>
            <div>
              <FieldLabel>WhatsApp</FieldLabel>
              <label className="flex items-center gap-2 text-sm text-ink dark:text-white">
                <Switch
                  size="small"
                  checked={whatsappEnabled}
                  onChange={(checked) => {
                    setWhatsappEnabled(checked);
                    if (checked && !whatsappPhone.trim()) setWhatsappPhone(phone);
                  }}
                />
                WhatsApp nömrəsini əlavə et
              </label>
              {whatsappEnabled && (
                <Input
                  className="mt-2"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="Məs: +994 50 123 45 67"
                  inputMode="tel"
                />
              )}
              <p className="mt-1 text-xs text-muted">Alıcılar bu nömrə ilə WhatsApp-da sizə yaza biləcək.</p>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Ünvan</FieldLabel>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Küçə, məhəllə (istəyə bağlı)" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel required>Təsvir</FieldLabel>
              <TextArea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Elanınızı ətraflı təsvir edin" />
            </div>
          </div>

          {subConfig && (
            <div>
              <h3 className="font-semibold text-ink dark:text-white mb-4 border-t border-line dark:border-line-dark pt-6">
                {subConfig.label} — detallar
              </h3>
              <DynamicForm
                fields={subConfig.fields}
                values={attributes}
                onChange={(name, value) => setAttributes((prev) => ({ ...prev, [name]: value }))}
              />
            </div>
          )}
        </div>
      )}

      {/* STEP 3: MEDIA */}
      {step === 3 && (
        <MediaUploader listingId={draftId} media={media} onChange={setMedia} />
      )}

      {/* STEP 4: AI CHECK/IMPROVE (optional) */}
      {step === 4 && (
        <div className="space-y-5">
          <Alert
            type="info"
            showIcon
            message="AI ilə elanı yoxlayın və yaxşılaşdırın (istəyə bağlı)"
            description="AI yalnız sizin daxil etdiyiniz məlumatlar əsasında işləyir və heç vaxt uydurma fakt əlavə etmir."
          />
          {unavailable && (
            <Alert type="warning" showIcon message="AI xidməti hazırda əlçatan deyil" description="Elanı əl ilə davam etdirə bilərsiniz — heç bir məlumat itirilməyib." />
          )}
          <div>
            <FieldLabel>Təsviri əlavə təlimatla yaxşılaşdırın</FieldLabel>
            <div className="flex gap-2">
              <Input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Məs: daha peşəkar tonda yaz" />
              <Button loading={aiLoading} onClick={handleImproveDescription}>AI ilə təsviri yaxşılaşdır</Button>
            </div>
          </div>
          <div>
            <FieldLabel>Sərbəst mətndən yenidən yarat</FieldLabel>
            <TextArea rows={4} value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Elanınızı sərbəst şəkildə təsvir edin..." />
            <Button className="mt-2" loading={aiLoading} onClick={() => generate(aiInput, category, subcategory)}>AI ilə sahələri doldur</Button>
          </div>
          {draft && (
            <div className="border border-line dark:border-line-dark p-4">
              <p className="font-semibold text-sm mb-2">AI təklifi:</p>
              <p className="text-sm"><strong>Başlıq:</strong> {draft.title}</p>
              <p className="text-sm mt-1"><strong>Təsvir:</strong> {draft.description}</p>
              {draft.warnings.length > 0 && (
                <ul className="mt-2 text-xs text-urgent list-disc list-inside">
                  {draft.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
              <div className="flex gap-2 mt-3">
                <Button type="primary" onClick={() => applyAIDraft()}>Redaktə et / Tətbiq et</Button>
                <Button onClick={() => generate(aiInput, category, subcategory)}>Yenidən yarat</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: PREVIEW */}
      {step === 5 && (
        <div className="market-surface p-6 max-w-sm">
          <p className="text-xs text-muted mb-1">{categoryConfig?.label} / {subConfig?.label}</p>
          <h3 className="font-semibold text-lg text-ink dark:text-white">{title || 'Başlıqsız elan'}</h3>
          <p className="text-2xl font-bold mt-1 text-ink dark:text-white">
            {priceHidden || !price ? 'Razılaşma yolu ilə' : formatPrice(price)}
          </p>
          <p className="text-sm text-muted mt-1">{city}</p>
          <p className="text-sm mt-3 whitespace-pre-line">{description}</p>
          <p className="text-xs text-muted mt-3">{media.length} media faylı əlavə edilib</p>
        </div>
      )}

      {/* STEP 6: PUBLISH */}
      {step === 6 && (
        <div className="text-center py-10">
          <p className="text-lg font-semibold text-ink dark:text-white mb-2">Elanı dərc etməyə hazırsınız</p>
          <p className="text-sm text-muted mb-6">Elanınız əvvəlcə admin yoxlamasına göndəriləcək. Təsdiqdən sonra saytda görünəcək və emailinizə link gələcək.</p>
          <Card className="mx-auto mb-6 max-w-2xl text-left" title={<span className="text-premium">✨ Elanı premium et</span>}>
            <p className="mb-4 text-sm text-muted">Elanınız siyahının əvvəlində göstərilsin və mağaza vitrininizdə fərqlənsin.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {([['top', 'Yuxarı qaldır', '5 AZN'], ['urgent', 'Təcili', '5 AZN'], ['vip', 'VIP vurğulama', '5 AZN']] as const).map(([value, label, priceLabel]) => (
                <button key={value} type="button" onClick={() => setPremiumPlan(premiumPlan === value ? null : value)} className={`rounded-xl border p-3 text-left transition ${premiumPlan === value ? 'border-premium bg-premium/10' : 'border-line dark:border-line-dark hover:border-premium'}`}>
                  <span className="block text-sm font-bold text-ink dark:text-white">{label}</span><span className="mt-1 block text-xs text-premium">{priceLabel} / {LISTING_PREMIUM_DAYS} gün</span>
                </button>
              ))}
            </div>
            {premiumPlan && <p className="mt-3 text-xs text-muted">Ödənişdən sonra premium status callback ilə aktivləşəcək.</p>}
          </Card>
          <Button type="primary" size="large" loading={publishing} onClick={handlePublish}>{premiumPlan ? `Ödəniş et və elan yerləşdir — ${LISTING_PREMIUM_AMOUNT.toFixed(2)} AZN` : 'Elanı yerləşdir'}</Button>
        </div>
      )}

      <Modal
        title="AI ilə məlumatları doldur"
        open={aiModalOpen}
        onCancel={() => setAiModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <p className="text-sm text-muted mb-3">Seçilmiş kateqoriya: <Tag>{categoryConfig?.label}</Tag>{subConfig && <Tag>{subConfig.label}</Tag>}</p>
        <TextArea
          rows={7}
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder="Məs: 2015 Toyota Camry, 145000 km, Bakı, 24000 AZN, ideal vəziyyətdə..."
        />
        {unavailable && <Alert className="mt-3" type="warning" showIcon message="AI xidməti hazırda əlçatan deyil" />}
        {draft?.warnings.length ? <Alert className="mt-3" type="warning" showIcon message={draft.warnings.join(' ')} /> : null}
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => setAiModalOpen(false)}>Bağla</Button>
          <Button loading={aiLoading} type="primary" disabled={!aiInput.trim()} onClick={async () => {
            const result = await generate(aiInput, category, subcategory);
            if (result) {
              applyAIDraft(result);
              setAiModalOpen(false);
            }
          }}>AI ilə doldur</Button>
        </div>
      </Modal>

      {/* NAVIGATION */}
      <div className="flex justify-between mt-10 pt-6 border-t border-line dark:border-line-dark">
        <Button disabled={step === 0} onClick={back}>Geri</Button>
        {step < STEP_LABELS.length - 1 && (
          <Button type="primary" disabled={!canProceedFrom(step)} onClick={next}>Növbəti</Button>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1.5 text-ink dark:text-white">
      {children}{required && <span className="text-urgent ml-0.5">*</span>}
    </label>
  );
}
