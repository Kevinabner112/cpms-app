'use client';
import { useState, useEffect, ReactNode } from 'react';

import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Sidebar } from '@/components/Sidebar';

export function ClientOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
    }
  }, []);

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
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 pb-24 md:pt-8 md:pb-8 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
