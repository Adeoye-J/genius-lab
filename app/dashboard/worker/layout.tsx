'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Banknote, BarChart, BriefcaseBusiness, DoorOpen, GitGraph, House, Map, Menu, Star } from 'lucide-react';
import { NotificationsBell } from '@/components/ui/NotificationsBell';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard/worker',
    label: 'Overview',
    icon: (
      <House />
    ),
  },
  {
    href: '/dashboard/worker/jobs',
    label: 'Jobs',
    icon: (
      <BriefcaseBusiness />
    ),
  },
  {
    href: '/dashboard/worker/payments',
    label: 'Payments',
    icon: (
      <Banknote />
    ),
  },
  {
    href: '/dashboard/worker/reviews',
    label: 'Reviews',
    icon: (
      <Star />
    ),
  },
  {
    href: '/dashboard/worker/analytics',
    label: 'Analytics',
    icon: (
      <BarChart />
    ),
  },
];

function Sidebar({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen flex flex-col border-r-2 bg-white">
      {/* Logo */}
      <div className="p-6 border-b-2 ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/80 rounded-lg flex items-center justify-center">
            <Map className='text-white' />
          </div>
          <span className="font-bold text-lg" style={{ color: 'hsl(var(--sidebar-foreground))' }}>StreetCred</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-primary text-white'
                  : 'hover:bg-primary/70 hover:text-white'
                }`}
              // style={{
              //   background: isActive ? 'hsl(var(--sidebar-accent))' : undefined,
              //   color: isActive ? 'hsl(var(--sidebar-primary-foreground))' : 'hsl(var(--sidebar-foreground) / 0.8)',
              // }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t-2">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary text-xs font-bold">
              {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary truncate capitalize">{userName}</p>
            <p className="text-xs">Worker</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all hover:bg-primary/10 font-semibold cursor-pointer"
        >
          <DoorOpen className='text-primary' />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function WorkerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState('Worker');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.success) setUserName(d.data.user.name); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/me', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar userName={userName} onLogout={handleLogout} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-transparent text-primary-foreground" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar userName={userName} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
            <Menu />
          </button>
          <span className="font-bold text-foreground flex-1">StreetCred</span>
          <NotificationsBell />
        </div>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}