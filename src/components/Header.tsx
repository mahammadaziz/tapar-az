import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Input, Avatar, Dropdown, Select } from 'antd';
import {
  SearchOutlined, HeartOutlined, PlusOutlined, UserOutlined, MessageOutlined, SettingOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useMyStore } from '@/hooks/useStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative text-xs font-medium tracking-tight transition-colors duration-200 ease-editorial xl:text-sm ${
    isActive ? 'text-action after:absolute after:-bottom-5 after:left-0 after:right-0 after:h-0.5 after:bg-action' : 'text-muted hover:text-action'
  }`;

export default function Header() {
  const { user, profile, logout, isAdmin } = useAuth();
  const { unreadCount } = useMessages(user?.uid);
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { store, reload: reloadStore } = useMyStore(user?.uid);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => { void reloadStore(); }, [location.pathname, reloadStore]);

  const storePath = store ? `/magaza/${store.slug}` : '/magaza-yarat';
  const storeLabel = store ? t('storeMine') : t('storeCreate');

  const handleSearch = () => {
    navigate(`/elanlar${searchValue ? `?q=${encodeURIComponent(searchValue)}` : ''}`);
  };

  const userMenuItems = [
    { key: 'profile', label: <Link to="/profil">{t('profile')}</Link> },
    { key: 'listings', label: <Link to="/profil/elanlarim">{t('myListings')}</Link> },
    { key: 'favorites', label: <Link to="/favoriler">{t('favorites')}</Link> },
    { key: 'store', label: <Link to={storePath}>{storeLabel}</Link> },
    { key: 'messages', label: <Link to="/mesajlar">Mesajlar</Link> },
    { type: 'divider' as const },
    { key: 'logout', label: t('logout'), onClick: () => logout() },
  ];

  return (
    <>
      {/* Desktop / tablet header */}
      <header className="hidden md:block sticky top-0 z-40 bg-paper/95 dark:bg-offwhite/95 backdrop-blur border-b border-line dark:border-line-dark shadow-[0_2px_12px_rgba(17,24,39,0.04)]">
        <div className="mx-auto grid h-16 max-w-[1840px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 xl:gap-6 xl:px-6">
          <Link to="/" className="font-display text-xl font-bold tracking-tightest text-ink dark:text-white shrink-0">
            <span className="text-ink dark:text-white">TAPAR</span><span className="text-action">.AZ</span>
          </Link>

          <nav className="flex min-w-0 items-center justify-self-center gap-3 lg:gap-4 xl:gap-5">
            <NavLink to="/" end className={navLinkClass}>{t('home')}</NavLink>
            <NavLink to="/elanlar" className={navLinkClass}>{t('listings')}</NavLink>
            <NavLink to="/kateqoriyalar" className={navLinkClass}>{t('categories')}</NavLink>
            <NavLink to="/magazalar" className={navLinkClass}>{t('stores')}</NavLink>
            <NavLink to={storePath} className={navLinkClass}>{storeLabel}</NavLink>
            {isAdmin && <Link to="/admin" className="inline-flex items-center gap-1 rounded-lg bg-action px-2.5 py-2 text-xs font-bold text-white transition hover:bg-[#e84f00]"><SettingOutlined /> {t('admin')}</Link>}
          </nav>

          <div className="min-w-0 flex items-center justify-end gap-3">
            <div className="min-w-0 w-[220px] xl:w-[280px]">
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onPressEnter={handleSearch}
                suffix={<SearchOutlined className="cursor-pointer text-action" onClick={handleSearch} />}
              />
            </div>

            <div className="flex shrink-0 items-center gap-3">
            <Link to="/favoriler" aria-label="Favorilər" title="Favorilər" className="text-muted hover:text-action text-lg transition-colors"><HeartOutlined /></Link>
            {user && (
              <Link to="/mesajlar" aria-label="Mesajlar" title="Mesajlar" className="relative text-muted hover:text-action text-lg transition-colors">
                <MessageOutlined />
                {unreadCount > 0 && <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-urgent px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </Link>
            )}
            <Select aria-label="Language" size="small" value={language} onChange={setLanguage} options={[{ value: 'az', label: 'AZ' }, { value: 'en', label: 'EN' }, { value: 'ru', label: 'RU' }]} className="w-[68px]" />
            <Link
              to="/elan-yerlesdir"
              className="market-action px-4 py-2 shadow-[0_5px_12px_rgb(var(--color-primary)/0.2)]"
            >
              <PlusOutlined /> {t('placeAd')}
            </Link>

            {user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar src={profile?.photoURL} icon={<UserOutlined />} className="cursor-pointer bg-graphite" />
              </Dropdown>
            ) : (
              <Link to="/login" className="text-sm font-medium hover:opacity-70">{t('login')}</Link>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile top bar (logo + theme) */}
      <header className="md:hidden sticky top-0 z-40 bg-paper/95 dark:bg-offwhite/95 backdrop-blur border-b border-line dark:border-line-dark">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-bold tracking-tightest text-ink dark:text-white">
            <span className="text-ink dark:text-white">TAPAR</span><span className="text-action">.AZ</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/favoriler" aria-label="Favorilər" title="Favorilər" className="text-lg text-muted hover:text-action"><HeartOutlined /></Link>
            {user && <Link to="/mesajlar" aria-label="Mesajlar" className="relative text-lg text-muted hover:text-action"><MessageOutlined />{unreadCount > 0 && <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-urgent px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}</Link>}
            <Select aria-label="Language" size="small" value={language} onChange={setLanguage} options={[{ value: 'az', label: 'AZ' }, { value: 'en', label: 'EN' }, { value: 'ru', label: 'RU' }]} className="w-[68px]" />
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper dark:bg-offwhite border-t border-line dark:border-line-dark">
        <div className="grid grid-cols-5 h-16">
          <MobileNavItem to="/" icon={<HomeOutlined />} label={t('home')} end />
          <MobileNavItem to="/elanlar" icon={<SearchOutlined />} label={t('search')} />
          <MobileNavItem to="/elan-yerlesdir" icon={<PlusOutlined />} label={t('placeAd')} prominent />
          <MobileNavItem to="/favoriler" icon={<HeartOutlined />} label={t('favorites')} />
          <MobileNavItem to={user ? '/profil' : '/login'} icon={<UserOutlined />} label={t('login')} />
        </div>
      </nav>
    </>
  );
}

function MobileNavItem({
  to, icon, label, end, prominent,
}: { to: string; icon: React.ReactNode; label: string; end?: boolean; prominent?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
          isActive ? 'text-ink dark:text-white' : 'text-muted'
        }`
      }
    >
      <span
        className={
          prominent
            ? 'w-9 h-9 rounded-full bg-action text-white flex items-center justify-center text-base -mt-4 shadow-lg'
            : 'text-lg'
        }
      >
        {icon}
      </span>
      {label}
    </NavLink>
  );
}
