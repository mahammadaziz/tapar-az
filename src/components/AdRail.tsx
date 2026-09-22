import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Reserved desktop inventory for future 160x600 / 300x600 advertising creatives. */
export default function AdRail({ side }: { side: 'left' | 'right' }) {
  const { t } = useTranslation();
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return undefined;
    const updateVisibility = () => {
      const footerTop = footer.getBoundingClientRect().top;
      const bannerTop = 96;
      const bannerBottom = bannerTop + 600;
      setFooterVisible(footerTop < bannerBottom && footerTop > bannerTop);
    };
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  return (
    <aside aria-label={`${side === 'left' ? t('left') : t('right')} ${t('adSpace')}`} className="hidden w-[160px] shrink-0 xl:block">
      <div className={`fixed top-24 z-30 w-[160px] transition-opacity duration-200 ${footerVisible ? 'pointer-events-none invisible opacity-0' : 'opacity-100'}`} style={side === 'left' ? { left: 'max(16px, calc(50% - 824px))' } : { right: 'max(16px, calc(50% - 824px))' }}>
        <AdSlot />
      </div>
    </aside>
  );
}

function AdSlot() {
  const { t } = useTranslation();
  return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-dashed border-line bg-offwhite/70 text-center dark:border-line-dark dark:bg-graphite/60">
      <div className="px-4 text-[10px] font-semibold uppercase leading-relaxed tracking-[.16em] text-muted"><span className="mb-2 block text-action">{t('ad')}</span>{t('banner')}<br />{t('space')}</div>
    </div>
  );
}
