import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="hidden md:block border-t border-line dark:border-line-dark mt-20 bg-footer">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-4 gap-10">
        <div>
          <div className="font-display text-xl font-bold tracking-tightest text-ink dark:text-white mb-3">
            TAPAR<span className="text-action">.AZ</span>
          </div>
          <p className="text-sm text-secondary dark:text-muted leading-relaxed">
            {t('heroText')}
          </p>
        </div>
        <FooterCol title={t('categories')} links={[
          [t('category.daşınmaz_əmlak'), '/kateqoriyalar'],
          [t('category.iş_elanları'), '/kateqoriyalar'], [t('category.xidmətlər'), '/kateqoriyalar'],
        ]} />
        <FooterCol title="Platform" links={[
          [t('placeAd'), '/elan-yerlesdir'], [t('aiListing'), '/ai-elan'],
          [t('favorites'), '/favoriler'], [t('messages'), '/mesajlar'],
        ]} />
        <FooterCol title="Account" links={[[t('login'), '/login'], ['Register', '/register']]} />
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-action mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-ink dark:text-white/90 hover:text-action transition-colors">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
