// app/(auth)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Auth' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">StreetCred</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Your work,<br />
            your record,<br />
            your credibility.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Join thousands of skilled workers building a verifiable financial identity through every job completed.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Workers', value: '12,000+' },
            { label: 'Jobs Done', value: '48,000+' },
            { label: 'NGN Paid', value: '₦2.4B+' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-4">
              <div className="text-white font-bold text-xl">{stat.value}</div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-foreground font-bold text-lg">StreetCred</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}