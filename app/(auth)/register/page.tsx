'use client';
// app/(auth)/register/page.tsx

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Role = 'worker' | 'customer';
type Field = 'name' | 'email' | 'phone' | 'password' | 'confirmPassword';

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

interface FieldError {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'worker',
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ---- Inline validation ----
  function validate(): boolean {
    const e: FieldError = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Enter your full name (at least 2 characters)';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email))
      e.email = 'Enter a valid email address';
    if (!form.phone || !/^(\+234|0)[789][01]\d{8}$/.test(form.phone))
      e.phone = 'Enter a valid Nigerian phone number (e.g. 08012345678)';
    if (!form.password || form.password.length < 8)
      e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(field: Field, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(data.error ?? 'Registration failed. Please try again.');
        return;
      }

      // Registration successful — redirect to onboarding
      router.push('/onboarding');
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground mb-2">Create your account</h2>
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Role selector */}
      <div className="mb-6">
        <label className="text-label mb-3 block">I am a</label>
        <div className="grid grid-cols-2 gap-3">
          {(['worker', 'customer'] as Role[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm((p) => ({ ...p, role }))}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all duration-150
                ${form.role === role
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-border/80'
                }
              `}
            >
              <div className="text-2xl mb-2">{role === 'worker' ? '🔧' : '👤'}</div>
              <div className="font-semibold text-foreground capitalize">{role}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {role === 'worker' ? 'Offer your skills & get hired' : 'Hire skilled workers'}
              </div>
              {form.role === role && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="text-label mb-1.5 block">Full name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Chukwuemeka Obi"
            className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              ${errors.name ? 'border-destructive' : 'border-input'}`}
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="text-label mb-1.5 block">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="you@example.com"
            className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              ${errors.email ? 'border-destructive' : 'border-input'}`}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="text-label mb-1.5 block">Phone number</label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="08012345678"
            className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              ${errors.phone ? 'border-destructive' : 'border-input'}`}
          />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="text-label mb-1.5 block">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="At least 8 characters"
              className={`w-full h-11 pl-4 pr-11 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm transition-colors
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                ${errors.password ? 'border-destructive' : 'border-input'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="text-label mb-1.5 block">Confirm password</label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder="Repeat your password"
            className={`w-full h-11 px-4 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground text-sm transition-colors
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              ${errors.confirmPassword ? 'border-destructive' : 'border-input'}`}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {serverError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm
            hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
            disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account…
            </span>
          ) : (
            'Create account'
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}