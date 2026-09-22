import { Link } from 'react-router-dom';
import { ArrowRightOutlined, CarOutlined, CheckCircleFilled, GiftOutlined, HomeOutlined, LaptopOutlined, RightOutlined, TeamOutlined, ToolOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, categoryLabel, subcategoryLabel } from '@/config/categories';
import { useLanguage } from '@/context/LanguageContext';

export default function Categories() {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return <main className="min-h-screen bg-offwhite pb-20 dark:bg-background">
    <section className="relative overflow-hidden bg-[#FF5A00] px-6 py-14 text-white md:py-20">
      <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#ffb07c]/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl"><p className="mb-4 text-xs font-bold uppercase tracking-[.22em] text-orange-300">{t('marketplace')}</p><h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">{t('categories')}</h1><p className="mt-5 max-w-xl text-base leading-7 text-white/65 md:text-lg">{t('categoryPageIntro')}</p></div>
        </div>
        <div className="mt-10 flex flex-wrap gap-3 text-sm text-white/70"><span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">{CATEGORIES.length} {t('categoriesCount')}</span><span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">{CATEGORIES.reduce((total, category) => total + category.subcategories.length, 0)} {t('subcategoriesCount')}</span><span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">{t('premiumSearch')}</span></div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-6 py-10 md:py-14"><div className="mb-7 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-action">{t('catalog')}</p><h2 className="mt-2 font-display text-2xl font-bold text-ink dark:text-white md:text-3xl">{t('chooseCategory')}</h2></div><Link to="/elanlar" className="hidden items-center gap-2 text-sm font-semibold text-action sm:inline-flex">{t('allAds')} <ArrowRightOutlined /></Link></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category, index) => <article key={category.key} className="category-card-reveal group relative overflow-hidden rounded-xl border border-line bg-paper shadow-[0_8px_20px_rgba(17,24,39,.07)] transition duration-500 hover:-translate-y-1.5 hover:border-action/40 hover:shadow-[0_18px_34px_rgba(254,108,44,.18)] dark:border-line-dark dark:bg-graphite" style={{ animationDelay: `${index * 70}ms` }}>
          <Link to={`/elanlar?category=${encodeURIComponent(category.key)}`} className="relative flex h-24 items-center gap-3 overflow-hidden px-3">
            <div className="absolute -right-8 -top-8 z-0 h-28 w-28 rounded-full bg-[#FE6C2C]/75 opacity-0 blur-[1px] transition duration-500 group-hover:scale-125 group-hover:opacity-100" />
            <CategoryIcon name={category.icon} />
            <span className="relative z-10 min-w-0 flex-1 pr-10"><span className="flex items-center gap-1 font-display text-sm font-bold leading-tight text-ink dark:text-white sm:text-base">{categoryLabel(category.key, language)}{category.key === 'elektronika' && <CheckCircleFilled className="text-[10px] text-action" />}</span><span className="mt-1 block text-[10px] text-muted">{category.subcategories.length} alt kateqoriya</span></span>
            <span className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#FE6C2C] text-[10px] font-extrabold text-white shadow-md transition duration-500 group-hover:rotate-6 group-hover:bg-white group-hover:text-[#FE6C2C]">{String(index + 1).padStart(2, '0')}</span>
          </Link>
          <div className="mt-5 border-t border-line pt-4 dark:border-line-dark"><div className="space-y-1">{category.subcategories.slice(0, 6).map((subcategory) => <Link key={subcategory.key} to={`/elanlar?category=${encodeURIComponent(category.key)}&subcategory=${encodeURIComponent(subcategory.key)}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-action/10 hover:text-action"><span className="truncate">{subcategoryLabel(subcategory.key, language)}</span><RightOutlined className="text-[10px] opacity-0 transition group-hover:opacity-100" /></Link>)}</div>{category.subcategories.length > 6 && <Link to={`/elanlar?category=${encodeURIComponent(category.key)}`} className="mt-3 inline-flex items-center gap-1 px-2 text-xs font-bold text-action">Hamısına bax <ArrowRightOutlined /></Link>}</div>
        </article>)}
      </div>
    </section>
  </main>;
}

function CategoryIcon({ name }: { name: string }) {
  const icons = {
    car: <CarOutlined />,
    home: <HomeOutlined />,
    briefcase: <TeamOutlined />,
    tool: <ToolOutlined />,
    laptop: <LaptopOutlined />,
    gift: <GiftOutlined />,
  };
  return <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base text-black shadow-sm">{icons[name as keyof typeof icons] ?? <GiftOutlined />}</span>;
}
