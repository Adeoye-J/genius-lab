'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationsBell } from '@/components/ui/NotificationsBell';
import { ArrowRight, BriefcaseBusiness, DoorOpen, House, Map, Menu, UserPlus } from 'lucide-react';
import { AuthUser } from '@/lib/auth/auth';

const NAV_ITEMS = [
  {
    href: '/dashboard/customer',
    label: 'Overview',
    icon: <House />,
  },
  {
    href: '/dashboard/customer/hire',
    label: 'Hire a Worker',
    icon: <UserPlus />,
  },
  {
    href: '/dashboard/customer/history',
    label: 'Job History',
    icon: <BriefcaseBusiness />,
  },
];

function Sidebar({ profilePicture, userName, onLogout, onCloseSidebar }: { profilePicture?: string, userName: string; onLogout: () => void; onCloseSidebar?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="w-64 min-h-screen flex flex-col border-r-2 bg-white dark:bg-black">
      <div className="p-6 border-b-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/80 rounded-lg flex items-center justify-center">
            <Map className='text-white' />
          </div>
          <span className="font-bold text-lg text-black dark:text-white">StreetCred</span>
        </div>
      </div>
      
      {/* Nav */}
      <nav className="flex-1 p-4 space-y-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onCloseSidebar}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all text-black dark:text-white
                ${ isActive
                  ? 'bg-primary text-white'
                  : 'hover:bg-primary/70 hover:text-white'
              }`}
            >
              {item.icon}{item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t-2">
        <Link href="/dashboard/customer/profile" className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-primary/10 dark:hover:bg-white/10 transition-all group cursor-pointer">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover border-4 border-white/20"
            />
          ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            <span className="text-primary text-sm font-bold">{userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
          </div>
          )}
          
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate capitalize">{userName}</p>
            <p className="text-xs transition-colors text-black dark:text-white flex items-center gap-1">Customer · Edit profile <ArrowRight size={16} className='group-hover:translate-x-1 transition-all duration-300' /></p>
          </div>
        </Link>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all bg-destructive text-white hover:bg-destructive/90 font-semibold cursor-pointer">
          <DoorOpen />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState('Customer');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState("")

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.success) {
        setProfilePicture(d.data.user.profileImage); 
        setUserName(d.data.user.name);
        console.log(userName)
        console.log(profilePicture)
      }}).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/me', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block shrink-0">
        <Sidebar profilePicture={profilePicture} userName={userName} onLogout={handleLogout} />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full" onClick={() => setMobileOpen(false)}><Sidebar userName={userName} onLogout={handleLogout} onCloseSidebar={() => setMobileOpen(false)} /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer">
            <Menu />
          </button>
          <span className="font-bold text-foreground flex-1">StreetCred</span>
          <NotificationsBell />
        </div>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}