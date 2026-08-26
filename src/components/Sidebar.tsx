'use client'
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers, PlusCircle, History, Package, ArrowRightLeft, ShieldAlert, FileWarning, BarChart3, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navSections = [
  {
    title: 'COLOR PANEL',
    items: [
      { name: 'Dashboard', label: 'Dashboard', href: '/panels/dashboard', icon: LayoutDashboard },
      { name: 'Inventory', label: 'Panel Inventory', href: '/panels', icon: Layers },
      { name: 'New', label: 'New Panel', href: '/panels/new', icon: PlusCircle },
      { name: 'Logs', label: 'Audit Logs', href: '/logs', icon: History },
    ]
  },
  {
    title: 'WHITE WOOD',
    items: [
      { name: 'WW Master', label: 'WW Master', href: '/whitewood', icon: Package },
      { name: 'WW Loans', label: 'WW Loans', href: '/whitewood/transactions', icon: ArrowRightLeft },
    ]
  },
  {
    title: 'LEAD CONTENT',
    items: [
      { name: 'Dashboard', label: 'LC Dashboard', href: '/lead-content/dashboard', icon: BarChart3 },
      { name: 'Tests', label: 'Test Inventory', href: '/lead-content', icon: ShieldAlert },
      { name: 'New Test', label: 'New Test', href: '/lead-content/new', icon: PlusCircle },
    ]
  },
  {
    title: 'PRE PRODUCTION SAMPLE',
    items: [
      { name: 'Dashboard', label: 'PPS Inventory', href: '/pps', icon: ClipboardCheck },
      { name: 'New PPS', label: 'New PPS', href: '/pps/new', icon: PlusCircle },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const safePathname = pathname || '';

  const isWhiteWood = safePathname.startsWith('/whitewood');
  const isLeadContent = safePathname.startsWith('/lead-content');
  const isPPS = safePathname.startsWith('/pps');
  
  const visibleSections = navSections.filter(section => {
    if (isWhiteWood) return section.title === 'WHITE WOOD';
    if (isLeadContent) return section.title === 'LEAD CONTENT';
    if (isPPS) return section.title === 'PRE PRODUCTION SAMPLE';
    return section.title === 'COLOR PANEL';
  });

  const getModuleName = () => {
    if (isWhiteWood) return 'White Wood';
    if (isLeadContent) return 'Lead Content';
    if (isPPS) return 'PPS Tracking';
    return 'Color Panel';
  };
  const currentModuleName = getModuleName();

  // For mobile bottom nav, flatten the items
  const flatNavItems = visibleSections.flatMap(section => section.items);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50">
        <div className="p-6 border-b border-slate-800 flex flex-col items-center text-center">
          <Image src="/icon-192x192.png" alt="Far East Seating Logo" width={80} height={80} className="mb-2" unoptimized />
          <h1 className="text-xl font-bold tracking-tight text-white">{currentModuleName}</h1>
          <p className="text-xs text-slate-400 mt-1">QC System &bull; Far East Seating</p>
        </div>
        <nav className="flex-1 p-4 space-y-6">
          {/* Back to Portal Button */}
          <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
            </div>
            <span>Module Portal</span>
          </Link>

          {visibleSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = safePathname === item.href || (safePathname.startsWith(item.href) && item.href !== '/');
                  // Quick fix for exact match on '/'
                  const isExactlyActive = safePathname === item.href;
                  const isChildActive = item.href !== '/' && safePathname.startsWith(item.href);
                  const isCurrent = isExactlyActive || isChildActive;

                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        isCurrent 
                          ? "bg-blue-600 text-white" 
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} PT Far East Seating
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-3">
          <Image src="/icon-192x192.png" alt="Logo" width={32} height={32} unoptimized />
          <div>
            <h1 className="text-sm font-bold tracking-wide leading-tight">{currentModuleName}</h1>
            <p className="text-[10px] text-slate-400">QC System</p>
          </div>
        </div>
        <Link href="/" className="p-2 bg-slate-800 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
          <LayoutDashboard className="w-5 h-5" />
        </Link>
      </div>

      {/* Mobile Bottom Nav */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-slate-200 z-50 flex items-center justify-around px-1 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)] overflow-x-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {flatNavItems.map((item) => {
          const isExactlyActive = safePathname === item.href;
          const isChildActive = item.href !== '/' && safePathname.startsWith(item.href);
          const isActive = isExactlyActive || isChildActive;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 transition-colors px-1",
                isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className="w-[20px] h-[20px]" />
              <span className="text-[9px] font-medium leading-none text-center whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
