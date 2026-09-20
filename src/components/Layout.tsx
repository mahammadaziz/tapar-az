import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import AdRail from './AdRail';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-200">
      <Header />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="site-with-ads mx-auto flex w-full max-w-[1840px] items-start gap-6 px-4 xl:gap-8 xl:px-0">
          <AdRail side="left" />
          <div className="min-w-0 flex-1">{children}</div>
          <AdRail side="right" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
