import { MailOutlined, PhoneOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

type InfoSection = 'about' | 'privacy' | 'contact';

const policyBlockKeys = [
  'collection', 'usage', 'payments', 'security', 'thirdParty', 'cookies',
  'retention', 'sharing', 'rights', 'choices', 'changes',
] as const;

export default function InfoPage({ section }: { section: InfoSection }) {
  const { t } = useTranslation();
  const base = `info.${section}`;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <div>
        <div className="border-b border-line px-1 py-10 dark:border-line-dark sm:py-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-action">{t(`${base}.eyebrow`)}</p>
          <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight text-ink dark:text-white">{t(`${base}.title`)}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-secondary dark:text-muted sm:text-lg">{t(`${base}.intro`)}</p>
        </div>
        <div className="px-1 py-8 sm:py-12">
          {section === 'about' && <AboutContent t={t} />}
          {section === 'privacy' && <PrivacyContent t={t} />}
          {section === 'contact' && <ContactContent t={t} />}
        </div>
      </div>
    </section>
  );
}

function AboutContent({ t }: { t: (key: string) => string }) {
  const cards = ['buyers', 'trust', 'support'] as const;
  const icons = [<TeamOutlined />, <SafetyOutlined />, <PhoneOutlined />];

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {cards.map((card, index) => (
        <InfoCard key={card} icon={icons[index]} title={t(`info.about.cards.${card}.title`)}>
          {t(`info.about.cards.${card}.text`)}
        </InfoCard>
      ))}
    </div>
  );
}

function PrivacyContent({ t }: { t: (key: string) => string }) {
  return (
    <div className="max-w-3xl space-y-7 text-sm leading-7 text-secondary dark:text-muted">
      {policyBlockKeys.map((key) => (
        <PolicyBlock key={key} title={t(`info.privacy.blocks.${key}.title`)}>
          {t(`info.privacy.blocks.${key}.text`)}
        </PolicyBlock>
      ))}
    </div>
  );
}

function ContactContent({ t }: { t: (key: string) => string }) {
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
      <div className="max-w-xl">
        <h2 className="font-display text-2xl font-bold text-ink dark:text-white">{t('info.contact.heading')}</h2>
        <p className="mt-3 text-sm leading-7 text-secondary dark:text-muted">{t('info.contact.text')}</p>
      </div>
      <div className="flex flex-col items-start gap-3">
        <a href="tel:+994771006446" className="inline-flex items-center gap-3 rounded-xl bg-action px-5 py-4 text-base font-bold text-white transition hover:bg-[#e84f00]">
          <PhoneOutlined />
          +994 77 100 64 46
        </a>
        <a href="mailto:1azizmahammad@gmail.com" className="inline-flex items-center gap-3 text-sm font-semibold text-action transition hover:underline">
          <MailOutlined />
          1azizmahammad@gmail.com
        </a>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <span className="text-2xl text-action">{icon}</span>
      <h2 className="mt-4 font-display text-lg font-bold text-ink dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-secondary dark:text-muted">{children}</p>
    </div>
  );
}

function PolicyBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink dark:text-white">{title}</h2>
      <p className="mt-2">{children}</p>
    </div>
  );
}

