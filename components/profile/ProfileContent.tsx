'use client';

// Shared profile edit page for both workers and customers.
// Workers see extra fields: bio, skills, location, availability.
// Access: click the user card at the bottom of either sidebar.

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { WORKER_PROFESSIONS, NIGERIAN_STATES } from '@/config/constants';

interface ProfileData {
  // User fields
  name: string;
  email: string;
  phone: string;
  role: string;
  profileImage: string;
  isVerified: boolean;
  createdAt: string;
  // Worker-only fields
  bio: string;
  skills: string;
  city: string;
  state: string;
  address: string;
  yearsOfExperience: string;
  isAvailable: boolean;
  profession: string;
  trustScore: number;
  totalJobsCompleted: number;
  averageRating: number;
}

function AvatarUploader({
  currentImage,
  name,
  onChange,
}: {
  currentImage: string;
  name: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleFile(file: File) {
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 1024 * 1024) {
      setError('Image must be under 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar preview */}
      <div
        className={`relative w-24 h-24 rounded-full cursor-pointer group transition-all
          ${dragging ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, hsl(221 66% 47%), hsl(221 68% 38%))' }}>
            {initials}
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        Change photo
      </button>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG or WebP · Max 1MB<br />Click or drag to upload
      </p>
    </div>
  );
}

export default function ProfileContent() {
  const router  = useRouter();

  const [form, setForm]           = useState<ProfileData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { router.push('/login'); return; }
        const { user, workerProfile } = d.data;
        setForm({
          name:          user.name         ?? '',
          email:         user.email        ?? '',
          phone:         user.phone        ?? '',
          role:          user.role         ?? '',
          profileImage:  user.profileImage ?? '',
          isVerified:    user.isVerified   ?? false,
          createdAt:     user.createdAt    ?? '',
          // Worker fields
          bio:               workerProfile?.bio                 ?? '',
          skills:            (workerProfile?.skills ?? []).join(', '),
          city:              workerProfile?.location?.city      ?? '',
          state:             workerProfile?.location?.state     ?? '',
          address:           workerProfile?.location?.address   ?? '',
          yearsOfExperience: String(workerProfile?.yearsOfExperience ?? 0),
          isAvailable:       workerProfile?.isAvailable         ?? true,
          profession:        workerProfile?.profession          ?? '',
          trustScore:        workerProfile?.trustScore          ?? 0,
          totalJobsCompleted: workerProfile?.totalJobsCompleted ?? 0,
          averageRating:     workerProfile?.averageRating       ?? 0,
        });
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  function update(field: keyof ProfileData, value: unknown) {
    setForm((p) => p ? { ...p, [field]: value } : p);
    setSuccess(false);
    setError('');
  }

  async function handleImageChange(dataUrl: string) {
    setUploadingImage(true);
    setError('');
    try {
      const res  = await fetch('/api/user/profile/image', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageData: dataUrl }),
      });
      const data = await res.json();
      if (data.success) {
        update('profileImage', dataUrl);
      } else {
        setError(data.error ?? 'Image upload failed');
      }
    } catch {
      setError('Network error uploading image');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
      };

      if (form.role === 'worker') {
        payload.bio               = form.bio;
        payload.skills            = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
        payload.city              = form.city;
        payload.state             = form.state;
        payload.address           = form.address;
        payload.yearsOfExperience = parseInt(form.yearsOfExperience || '0', 10);
        payload.isAvailable       = form.isAvailable;
      }

      const res  = await fetch('/api/user/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to save profile');
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-1">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className='text-gray-500 text-sm'>Loading profile...</p>
      </div>
    );
  }

  if (!form) return null;

  const isWorker    = form.role === 'worker';
  const memberSince = form.createdAt
    ? new Date(form.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {/* <div>
          <h1 className="text-2xl font-extrabold text-foreground">Edit profile</h1>
          <p className="text-muted-foreground text-sm">Member since {memberSince}</p>
        </div> */}
        <div className="">
            <p className="text-foreground font-semibold text-xl mb-1 capitalize">Edit Profile</p>
            <p className="text-sm text-foreground/60">Member since {memberSince}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-5">Profile photo</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <AvatarUploader
              currentImage={form.profileImage}
              name={form.name}
              onChange={handleImageChange}
            />
            {uploadingImage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Uploading…
              </div>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Basic information</h2>

          <div>
            <label className="text-label mb-1.5 block">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-label mb-1.5 block">Email address</label>
              <div className="h-11 px-4 rounded-lg border border-border bg-muted flex items-center">
                <span className="text-sm text-muted-foreground">{form.email}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-label mb-1.5 block">Phone number</label>
              <div className="h-11 px-4 rounded-lg border border-border bg-muted flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{form.phone}</span>
                {form.isVerified && (
                  <span className="text-xs text-accent font-medium ml-auto">✓ Verified</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Contact support to change phone</p>
            </div>
          </div>
        </div>

        {/* Worker-specific fields */}
        {isWorker && (
          <>
            {/* Stats (read-only) */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Your stats</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-extrabold text-foreground">{form.trustScore}</p>
                  <p className="text-xs text-muted-foreground">Trust score</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground">{form.totalJobsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Jobs done</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground">
                    {form.averageRating > 0 ? form.averageRating.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg rating</p>
                </div>
              </div>
            </div>

            {/* Professional info */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Professional details</h2>

              {/* Profession — read-only (changing it would affect trust history) */}
              <div>
                <label className="text-label mb-1.5 block">Profession</label>
                <div className="h-11 px-4 rounded-lg border border-border bg-muted flex items-center">
                  <span className="text-sm text-muted-foreground">{form.profession}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Contact support to change profession</p>
              </div>

              <div>
                <label className="text-label mb-1.5 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell customers about yourself and your experience…"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">{form.bio.length}/500</p>
              </div>

              <div>
                <label className="text-label mb-1.5 block">Skills</label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => update('skills', e.target.value)}
                  placeholder="e.g. car servicing, engine repair, brake replacement"
                  className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">Separate each skill with a comma</p>
              </div>

              <div>
                <label className="text-label mb-1.5 block">Years of experience</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={form.yearsOfExperience}
                  onChange={(e) => update('yearsOfExperience', e.target.value)}
                  className="w-32 h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Availability toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Available for work</p>
                  <p className="text-xs text-muted-foreground">Show up in customer searches</p>
                </div>
                <button
                  type="button"
                  onClick={() => update('isAvailable', !form.isAvailable)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-200 ${form.isAvailable ? 'bg-accent' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Location */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Location</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label mb-1.5 block">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    placeholder="Lagos"
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-label mb-1.5 block">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-label mb-1.5 block">Address (optional)</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Street address or area"
                  className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </>
        )}

        {/* Error / success */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
            </svg>
            Profile updated successfully
          </div>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Saving…
            </span>
          ) : 'Save changes'}
        </button>
      </form>
    </div>
  );
}