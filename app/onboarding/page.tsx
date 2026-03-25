'use client';

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
        className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm
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
          className="flex-1 h-11 rounded-lg border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-all"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Worker Step 3 — Bank account
// ----------------------------------------------------------------
const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank' },
  { code: '050', name: 'EcoBank' },
  { code: '011', name: 'First Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '058', name: 'Guaranty Trust Bank (GTB)' },
  { code: '076', name: 'Polaris Bank' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '068', name: 'Standard Chartered' },
  { code: '232', name: 'Sterling Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '032', name: 'Union Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '090110', name: 'Opay' },
  { code: '090405', name: 'Moniepoint' },
  { code: '100004', name: 'Kuda Bank' },
  { code: '090317', name: 'PalmPay' },
];

function WorkerStep3({ data, setData, onSubmit, onBack, loading }: {
  data: { bankName: string; bankCode: string; accountName: string; accountNumber: string };
  setData: (d: Partial<typeof data>) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [errors, setErrors] = useState<Partial<typeof data>>({});

  function handleBankChange(code: string) {
    const bank = NIGERIAN_BANKS.find((b) => b.code === code);
    setData({ bankCode: code, bankName: bank?.name ?? '' });
  }

  function validate() {
    const e: Partial<typeof data> = {};
    if (!data.bankCode) e.bankCode = 'Select your bank';
    if (!data.accountNumber || data.accountNumber.length !== 10 || !/^\d{10}$/.test(data.accountNumber))
      e.accountNumber = 'Account number must be exactly 10 digits';
    if (!data.accountName.trim()) e.accountName = 'Enter the account holder name';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (validate()) onSubmit();
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-1">Where should we send payments?</h3>
        <p className="text-muted-foreground">Your bank details are encrypted and only used for job payouts</p>
      </div>

      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex gap-3">
        <svg className="w-5 h-5 text-accent mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-sm text-foreground">
          Your account details are stored securely and used only to process verified job payments through Interswitch.
        </p>
      </div>

      <div>
        <label className="text-label mb-1.5 block">Bank *</label>
        <select
          value={data.bankCode}
          onChange={(e) => handleBankChange(e.target.value)}
          className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground text-sm
            focus:outline-none focus:ring-2 focus:ring-ring ${errors.bankCode ? 'border-destructive' : 'border-input'}`}
        >
          <option value="">Select your bank</option>
          {NIGERIAN_BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
        </select>
        {errors.bankCode && <p className="mt-1 text-xs text-destructive">{errors.bankCode}</p>}
      </div>

      <div>
        <label className="text-label mb-1.5 block">Account number *</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={10}
          value={data.accountNumber}
          onChange={(e) => setData({ accountNumber: e.target.value.replace(/\D/g, '') })}
          placeholder="0123456789"
          className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm font-mono tracking-widest
            focus:outline-none focus:ring-2 focus:ring-ring ${errors.accountNumber ? 'border-destructive' : 'border-input'}`}
        />
        {errors.accountNumber
          ? <p className="mt-1 text-xs text-destructive">{errors.accountNumber}</p>
          : <p className="mt-1 text-xs text-muted-foreground">10 digits, no spaces or dashes</p>
        }
      </div>

      <div>
        <label className="text-label mb-1.5 block">Account holder name *</label>
        <input
          type="text"
          value={data.accountName}
          onChange={(e) => setData({ accountName: e.target.value })}
          placeholder="As it appears on your bank statement"
          className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm
            focus:outline-none focus:ring-2 focus:ring-ring ${errors.accountName ? 'border-destructive' : 'border-input'}`}
        />
        {errors.accountName && <p className="mt-1 text-xs text-destructive">{errors.accountName}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 h-11 rounded-lg border border-border bg-card text-foreground font-semibold text-sm hover:bg-muted transition-all disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 h-11 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Setting up your profile…
            </span>
          ) : (
            'Complete setup'
          )}
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
        className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm
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
  const [w3, setW3] = useState({ bankName: '', bankCode: '', accountName: '', accountNumber: '' });

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
          accountName: w3.accountName,
          accountNumber: w3.accountNumber,
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