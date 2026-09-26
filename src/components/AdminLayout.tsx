import type { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { DashboardOutlined, CheckSquareOutlined, TeamOutlined, ArrowLeftOutlined, SafetyOutlined, SettingOutlined, ShopOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const links = [
    ['/admin', 'Dashboard', <DashboardOutlined />],
    ['/admin/elanlar', 'Elan təsdiqi', <CheckSquareOutlined />],
    ['/admin/stores', 'Mağaza və ödənişlər', <ShopOutlined />],
    ['/admin/users', 'İstifadəçilər', <TeamOutlined />],
    ['/admin/settings', 'Ayarlar', <SettingOutlined />],
  ] as const;
  return <div className="min-h-screen bg-background text-ink flex flex-col">
    <header className="border-b border-line bg-paper shadow-card">
      <div className="max-w-[1500px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/admin" className="flex items-center gap-3 font-semibold tracking-tight"><span className="w-9 h-9 rounded-xl bg-action flex items-center justify-center"><SafetyOutlined /></span><span>TAPAR <span className="text-action">ADMIN</span></span></Link>
        <div className="flex items-center gap-3 text-sm text-muted"><span className="hidden sm:block">{user?.email ?? 'Demo panel'}</span>{user && <button onClick={() => void logout()} className="hover:text-action">Çıxış</button>}</div>
      </div>
    </header>
    <div className="flex-1 max-w-[1500px] w-full mx-auto flex flex-col lg:flex-row">
      <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-line p-4 lg:p-6 bg-paper">
        <p className="text-[10px] uppercase tracking-[.2em] text-muted mb-3">İdarəetmə</p>
        <nav className="flex lg:block gap-2 overflow-x-auto">
          {isAdmin && links.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-3 text-sm transition ${isActive ? 'bg-action text-white' : 'text-muted hover:bg-offwhite hover:text-action'}`}>{icon}{label}</NavLink>)}
          <Link to="/" className="flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-3 text-sm text-muted hover:bg-offwhite hover:text-action"><ArrowLeftOutlined /> Sayta qayıt</Link>
        </nav>
      </aside>
      <main className="flex-1 p-5 lg:p-8">{children}</main>
    </div>
    <footer className="border-t border-line bg-footer px-5 py-5 text-center text-xs text-muted">© {new Date().getFullYear()} TAPAR.AZ Admin Console · Təhlükəsiz idarəetmə</footer>
  </div>;
}
