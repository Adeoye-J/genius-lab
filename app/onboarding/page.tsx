'use client';
// app/onboarding/page.tsx
// Multi-step onboarding flow.
// Step detection is based on the user's role (fetched on mount).
// Workers: 3 steps (profession → skills/bio → bank account)
// Customers: 1 step (confirm name + preferred services)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WORKER_PROFESSIONS, NIGERIAN_STATES } from '@/config/constants';

type Role = 'worker' | 'customer';

interface UserInfo {
  name: string;
  role: Role;
}

// ----------------------------------------------------------------
// Step progress indicator
// ----------------------------------------------------------------
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
            ${i + 1 < current ? 'bg-accent text-accent-foreground' :
              i + 1 === current ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'}`}
          >
            {i + 1 < current ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-12 rounded transition-all ${i + 1 < current ? 'bg-accent' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// Worker Step 1 — Profession
// ----------------------------------------------------------------
function WorkerStep1({ data, setData, onNext }: {
  data: { profession: string };
  setData: (d: { profession: string }) => void;
  onNext: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <h3 className="text-2xl font-bold text-foreground mb-1">What do you do?</h3>
      <p className="text-muted-foreground mb-6">Select your primary profession</p>

      <div className="grid grid-cols-2 gap-2 mb-8">
        {WORKER_PROFESSIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setData({ profession: p })}
            className={`px-4 py-3 rounded-xl border text-left text-sm transition-all
              ${data.profession === p
                ? 'border-primary bg-primary/5 text-primary font-semibold'
                : 'border-border bg-card text-foreground hover:border-muted-foreground'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!data.profession}
        className="w-full h-11 rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer
          hover:bg-primary/90 active:scale-[0.98] transition-all
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// Worker Step 2 — Skills, Bio, Location, Experience
// ----------------------------------------------------------------
function WorkerStep2({ data, setData, onNext, onBack }: {
  data: { skills: string; bio: string; city: string; state: string; yearsOfExperience: string };
  setData: (d: Partial<typeof data>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState('');

  function handleNext() {
    if (!data.city.trim() || !data.state) {
      setError('Please enter your city and state');
      return;
    }
    setError('');
    onNext();
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">Tell customers about yourself</h3>
        <p className="text-muted-foreground">This information helps customers find and trust you</p>
      </div>

      <div>
        <label className="text-label mb-1.5 block">Skills (comma-separated)</label>
        <input
          type="text"
          value={data.skills}
          onChange={(e) => setData({ skills: e.target.value })}
          placeholder="e.g. car servicing, engine repair, brake replacement"
          className="w-full h-11 px-4 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm
            focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">Separate each skill with a comma</p>
      </div>

      <div>
        <label className="text-label mb-1.5 block">Short bio</label>
        <textarea
          value={data.bio}
          onChange={(e) => setData({ bio: e.target.value })}
          placeholder="Tell customers who you are and what makes you good at your work…"
          maxLength={500}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">{data.bio.length}/500 characters</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-label mb-1.5 block">City *</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => setData({ city: e.target.value })}
            placeholder="Ikeja"
            className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm
              focus:outline-none focus:ring-2 focus:ring-ring ${error ? 'border-destructive' : 'border-input'}`}
          />
        </div>
        <div>
          <label className="text-label mb-1.5 block">State *</label>
          <select
            value={data.state}
            onChange={(e) => setData({ state: e.target.value })}
            className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground text-sm
              focus:outline-none focus:ring-2 focus:ring-ring ${error ? 'border-destructive' : 'border-input'}`}
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-label mb-1.5 block">Years of experience</label>
        <input
          type="number"
          value={data.yearsOfExperience}
          onChange={(e) => setData({ yearsOfExperience: e.target.value })}
          min={0}
          max={60}
          placeholder="0"
          className="w-32 h-11 px-4 rounded-lg border border-input bg-card text-foreground text-sm
            focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-11 rounded-lg border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-all cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 h-11 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Worker Step 3 — Bank account with live verification
// ----------------------------------------------------------------

interface BankItem { code: string; name: string; }

function WorkerStep3({ data, setData, onSubmit, onBack, loading }: {
  data: { bankName: string; bankCode: string; accountName: string; accountNumber: string; bankVerified: boolean };
  setData: (d: Partial<typeof data>) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [banks, setBanks]             = useState<BankItem[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [resolving, setResolving]     = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [bankError, setBankError]     = useState('');
  const [accountError, setAccountError] = useState('');

  // Fetch live bank list on mount
  useEffect(() => {
    fetch('/api/banking/banks')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBanks(d.data.map((b: { code: string; name: string }) => ({ code: b.code, name: b.name })));
        else setBanks([]); // graceful fallback — user can still manually type
      })
      .catch(() => setBanks([]))
      .finally(() => setBanksLoading(false));
  }, []);

  // Reset verification whenever bank or account number changes
  function handleBankChange(code: string) {
    const bank = banks.find((b) => b.code === code);
    setData({ bankCode: code, bankName: bank?.name ?? '', accountName: '', bankVerified: false });
    setResolveError('');
    setBankError('');
  }

  function handleAccountNumberChange(val: string) {
    const digits = val.replace(/\D/g, '');
    setData({ accountNumber: digits, accountName: '', bankVerified: false });
    setResolveError('');
    setAccountError('');
  }

  // Auto-resolve when both bank and 10-digit account number are present
  useEffect(() => {
    if (!data.bankCode || data.accountNumber.length !== 10 || data.bankVerified) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setResolving(true);
      setResolveError('');

      try {
        const res  = await fetch('/api/banking/resolve', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ accountNumber: data.accountNumber, bankCode: data.bankCode }),
        });
        const d = await res.json();

        if (cancelled) return;

        if (d.success && d.data?.accountName) {
          setData({
            accountName:  d.data.accountName,
            bankName:     d.data.bankName ?? data.bankName,
            bankVerified: true,
          });
        } else {
          setResolveError(d.error ?? 'Account not found. Check your bank and account number.');
          setData({ accountName: '', bankVerified: false });
        }
      } catch {
        if (!cancelled) setResolveError('Could not verify account. Please try again.');
      } finally {
        if (!cancelled) setResolving(false);
      }
    }, 600); // 600ms debounce after typing stops

    return () => { cancelled = true; clearTimeout(timer); };
  }, [data.accountNumber, data.bankCode]); // eslint-disable-line react-hooks/exhaustive-deps

  function validate() {
    let valid = true;
    if (!data.bankCode) { setBankError('Select your bank'); valid = false; }
    if (!data.accountNumber || data.accountNumber.length !== 10) {
      setAccountError('Account number must be exactly 10 digits'); valid = false;
    }
    if (!data.bankVerified) {
      setResolveError('Please wait for account verification to complete');
      valid = false;
    }
    return valid;
  }

  function handleSubmit() {
    if (validate()) onSubmit();
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">Where should we send payments?</h3>
        <p className="text-muted-foreground">Your bank account will be verified automatically</p>
      </div>

      {/* Security note */}
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex gap-3">
        <svg className="w-5 h-5 text-accent mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-sm text-foreground">
          We verify your account number directly with your bank via Interswitch.
          Your account name is confirmed automatically — no manual entry needed.
        </p>
      </div>

      {/* Bank selector */}
      <div>
        <label className="text-label mb-1.5 block">Bank *</label>
        {banksLoading ? (
          <div className="h-11 rounded-lg border border-input bg-muted flex items-center px-4 gap-2">
            <svg className="w-4 h-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span className="text-sm text-muted-foreground">Loading banks…</span>
          </div>
        ) : (
          <select
            value={data.bankCode}
            onChange={(e) => handleBankChange(e.target.value)}
            className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground text-sm
              focus:outline-none focus:ring-2 focus:ring-ring ${bankError ? 'border-destructive' : 'border-input'}`}
          >
            <option value="">Select your bank</option>
            {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
        )}
        {bankError && <p className="mt-1 text-xs text-destructive">{bankError}</p>}
      </div>

      {/* Account number */}
      <div>
        <label className="text-label mb-1.5 block">Account number *</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={data.accountNumber}
            onChange={(e) => handleAccountNumberChange(e.target.value)}
            placeholder="0123456789"
            className={`w-full h-11 pl-4 pr-10 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm font-mono tracking-widest
              focus:outline-none focus:ring-2 focus:ring-ring
              ${accountError ? 'border-destructive' : data.bankVerified ? 'border-accent' : 'border-input'}`}
          />
          {/* Status indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {resolving && (
              <svg className="w-4 h-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {!resolving && data.bankVerified && (
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
            )}
          </div>
        </div>
        {accountError && <p className="mt-1 text-xs text-destructive">{accountError}</p>}
        {!accountError && (
          <p className="mt-1 text-xs text-muted-foreground">
            {data.accountNumber.length < 10
              ? `${data.accountNumber.length}/10 digits`
              : resolving
                ? 'Verifying with your bank…'
                : data.bankVerified
                  ? 'Account verified ✓'
                  : '10 digits, no spaces'}
          </p>
        )}
      </div>

      {/* Resolve error */}
      {resolveError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {resolveError}
        </div>
      )}

      {/* Verified account name — shown automatically, not editable */}
      {data.bankVerified && data.accountName && (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Account verified</p>
              <p className="text-sm font-bold text-foreground">{data.accountName}</p>
              <p className="text-xs text-muted-foreground">{data.bankName} · {data.accountNumber}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            This name was confirmed directly by your bank. Payments will be sent to this account.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} disabled={loading || resolving}
          className="flex-1 h-11 rounded-lg border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-all disabled:opacity-50">
          Back
        </button>
        <button type="button" onClick={handleSubmit}
          disabled={loading || resolving || !data.bankVerified}
          className="flex-1 h-11 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-60">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Setting up your profile…
            </span>
          ) : resolving ? 'Verifying account…' : 'Complete setup'}
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Customer onboarding — single step
// ----------------------------------------------------------------
const POPULAR_SERVICES = [
  'Mechanic', 'Electrician', 'Plumber', 'Tailor', 'Barber / Hairdresser',
  'Food Vendor', 'Carpenter', 'Painter', 'Cleaner', 'Laundry',
];

function CustomerStep({ name, loading, onSubmit }: {
  name: string;
  loading: boolean;
  onSubmit: (services: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(s: string) {
    setSelected((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  return (
    <div className="animate-fade-in">
      <h3 className="text-2xl font-bold text-foreground mb-1">Welcome to StreetCred, {name.split(' ')[0]}!</h3>
      <p className="text-muted-foreground mb-6">
        What types of workers do you usually hire? (optional — helps us show better recommendations)
      </p>

      <div className="grid grid-cols-2 gap-2 mb-8">
        {POPULAR_SERVICES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={`px-4 py-3 rounded-xl border text-left text-sm transition-all
              ${selected.includes(s)
                ? 'border-primary bg-primary/5 text-primary font-semibold'
                : 'border-border bg-card text-foreground hover:border-muted-foreground'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSubmit(selected)}
        disabled={loading}
        className="w-full h-11 rounded-lg bg-primary text-white cursor-pointer font-semibold text-sm
          hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Finishing up…
          </span>
        ) : (
          'Find workers near me →'
        )}
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// Main onboarding page
// ----------------------------------------------------------------
export default function OnboardingPage() {
  const router = useRouter();

  const [user, setUser]   = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep]   = useState(1);
  const [error, setError] = useState('');

  // Worker state
  const [w1, setW1] = useState({ profession: '' });
  const [w2, setW2] = useState({ skills: '', bio: '', city: '', state: '', yearsOfExperience: '' });
  const [w3, setW3] = useState({ bankName: '', bankCode: '', accountName: '', accountNumber: '', bankVerified: false });

  // Fetch current user on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const u = d.data.user;
          if (u.isOnboarded) {
            router.replace(u.role === 'worker' ? '/dashboard/worker' : '/dashboard/customer');
          } else {
            setUser({ name: u.name, role: u.role });
          }
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function submitWorker() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profession: w1.profession,
          skills: w2.skills.split(',').map((s) => s.trim()).filter(Boolean),
          bio: w2.bio,
          city: w2.city,
          state: w2.state,
          yearsOfExperience: parseInt(w2.yearsOfExperience || '0', 10),
          bankName: w3.bankName,
          bankCode: w3.bankCode,
          accountNumber: w3.accountNumber,
          bankVerified: w3.bankVerified,   // tells server the account was resolved
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error ?? 'Setup failed'); return; }
      router.push('/dashboard/worker');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  async function submitCustomer(preferredServices: string[]) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user?.name, preferredServices }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error ?? 'Setup failed'); return; }
      router.push('/dashboard/customer');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {user.role === 'worker' ? 'Worker setup' : 'Customer setup'} • Step {step} of {user.role === 'worker' ? 3 : 1}
        </p>
        <h2 className="text-3xl font-extrabold text-foreground mt-1">
          {user.role === 'worker' ? 'Set up your profile' : `Welcome, ${user.name.split(' ')[0]}`}
        </h2>
      </div>

      {user.role === 'worker' && <StepIndicator current={step} total={3} />}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {user.role === 'worker' && (
        <>
          {step === 1 && <WorkerStep1 data={w1} setData={setW1} onNext={() => setStep(2)} />}
          {step === 2 && (
            <WorkerStep2
              data={w2}
              setData={(d) => setW2((p) => ({ ...p, ...d }))}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <WorkerStep3
              data={w3}
              setData={(d) => setW3((p) => ({ ...p, ...d }))}
              onSubmit={submitWorker}
              onBack={() => setStep(2)}
              loading={loading}
            />
          )}
        </>
      )}

      {user.role === 'customer' && (
        <CustomerStep name={user.name} loading={loading} onSubmit={submitCustomer} />
      )}
    </div>
  );
}