'use client';
import { useState, useEffect, ReactNode } from 'react';

import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Sidebar } from '@/components/Sidebar';

export function ClientOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);
  const { fetchData, isInitialized } = useStore();

  useEffect(() => {
    setHasMounted(true);
    
    if (!isInitialized) {
      fetchData();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
    }
  }, [fetchData, isInitialized]);

  if (!hasMounted) {
    return null;
  }

  const isPortal = pathname === '/';

  if (isPortal) {
    return <main className="flex-1 w-full min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 md:ml-64 relative min-h-screen overflow-x-hidden bg-slate-50">
        {/* Elegant Light Background for Inner Modules */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-200/50 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-[-10%] left-[15%] w-[600px] h-[600px] bg-slate-300/40 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse" style={{ animationDuration: '12s' }}></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-4 md:p-8 pt-20 pb-24 md:pt-8 md:pb-8 min-h-screen">
          {children}
        </div>
      </main>
    </>
  );
}
