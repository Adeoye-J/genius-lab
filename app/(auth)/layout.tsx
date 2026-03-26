import type { Metadata } from 'next';
import {ClipboardCheck, Landmark, Map, Route, ShieldCheck, TrafficCone} from "lucide-react"
import Link from 'next/link';

export const metadata: Metadata = { title: 'Auth' };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12">
        <div className='space-y-8'>
          <Link className="flex items-center gap-3 mb-16 cursor-pointer" href={"/"}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Map className='text-white' />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">StreetCred</span>
          </Link>

          <h1 className="font-extrabold text-white leading-tight text-4xl xl:text-5xl">
            Your journey to<br /> financial freedom<br /> starts here.
          </h1>

          {/* <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Your work,<br />
            your record,<br />
            your credibility.
          </h1> */}
          <p className="text-white/70 text-lg leading-relaxed max-w-lg">
            Join skilled workers building a verifiable financial identity through every job completed.
          </p>

          <div className="flex flex-col gap-6 text-white">
            <div className="flex items-start gap-4">
              <div className="rounded-full p-3 bg-white/20">
                <ShieldCheck width={24} className='' />
              </div>
              <div className="">
                <h3 className='text-xl text-white/90'>Secure Identity</h3>
                <p className='text-white/70 text-lg leading-relaxed max-w-lg'>Verifiable digital profile protecting your professional reputation.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full p-3 bg-white/20">
                <ClipboardCheck width={24} className='' />
              </div>
              <div className="">
                <h3 className='text-xl text-white/90'>Track Every Job</h3>
                <p className='text-white/70 text-lg leading-relaxed max-w-lg'>Build a portable work history that goes wherever you go.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-full p-3 bg-white/20">
                <Landmark width={24} className='' />
              </div>
              <div className="">
                <h3 className='text-xl text-white/90'>Access to Credit</h3>
                <p className='text-white/70 text-lg leading-relaxed max-w-lg'>Use your earnings record to unlock loans and financial tools.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {/* <div className="grid grid-cols-3 gap-4">
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
        </div> */}
        <div className="">
          <p className='text-white/60 font-semibold'>&copy; 2026 StreetCred Financial. All right reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link className="flex items-center justify-center gap-2 mb-8 lg:hidden cursor-pointer" href={"/"}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Map className='text-white' />
            </div>
            <span className="text-foreground font-bold text-lg">StreetCred</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}