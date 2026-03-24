'use client';
//
// Inline Checkout integration:
//  1. API call to /api/payments/initialize returns checkoutConfig + scriptUrl
//  2. We dynamically load the Interswitch inline-checkout.js script
//  3. Call window.webpayCheckout(config) — widget opens as popup overlay
//  4. onComplete callback fires when customer finishes (success or failure)
//  5. We then call /api/payments/verify server-side to get authoritative status
//     (docs: "Do not trust the onComplete response — perform a server-side requery")

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface JobSummary {
  _id: string;
  title: string;
  price: number;
  workerId: { profession: string; trustScore: number };
}

// Extend Window to include the Interswitch checkout function
declare global {
  interface Window {
    webpayCheckout: (config: Record<string, unknown>) => void;
  }
}

type PayState = 'loading' | 'ready' | 'paying' | 'verifying' | 'done';

export default function PayPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const jobId        = searchParams.get('jobId') ?? '';

  const [job, setJob]               = useState<JobSummary | null>(null);
  const [state, setState]           = useState<PayState>('loading');
  const [error, setError]           = useState('');
  const [checkoutConfig, setConfig] = useState<Record<string, unknown> | null>(null);
  const [transactionRef, setTxnRef] = useState('');
  const scriptLoaded                = useRef(false);

  // Load job details
  useEffect(() => {
    if (!jobId) { router.push('/dashboard/customer/history'); return; }
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setJob(d.data); setState('ready'); }
        else setError('Job not found');
      })
      .catch(() => setError('Failed to load job'));
  }, [jobId, router]);

  // Dynamically load the Interswitch inline-checkout.js script
  function loadInlineScript(scriptUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (scriptLoaded.current) { resolve(); return; }
      const script    = document.createElement('script');
      script.src      = scriptUrl;
      script.async    = true;
      script.onload   = () => { scriptLoaded.current = true; resolve(); };
      script.onerror  = () => reject(new Error('Failed to load Interswitch checkout script'));
      document.body.appendChild(script);
    });
  }

  async function handlePay() {
    setState('paying');
    setError('');

    try {
      // Step 1 — Get checkout config from server (includes access_token)
      const res  = await fetch('/api/payments/initialize', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to initialise payment');
        setState('ready');
        return;
      }

      const { checkoutConfig: config, scriptUrl, transactionRef: txnRef } = data.data;
      setConfig(config);
      setTxnRef(txnRef);

      // Step 2 — Load Interswitch script
      await loadInlineScript(scriptUrl);

      if (!window.webpayCheckout) {
        throw new Error('Interswitch checkout script did not load correctly');
      }

      // Step 3 — Open inline checkout widget
      // The widget is a popup overlay — customer stays on this page
      window.webpayCheckout({
        ...config,
        // onComplete fires when the customer finishes (success, failure, or close)
        // The docs warn: do NOT use this response to give value
        // We only use it as a signal to trigger our server-side verify
        onComplete: async (response: Record<string, unknown>) => {
          console.log('[Interswitch] onComplete:', response);
          // Redirect to our callback page which does the real verification
          router.push(`/payments/callback?txnref=${txnRef}`);
        },
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed to start');
      setState('ready');
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Pay for completed job</h1>
          <p className="text-muted-foreground text-sm mt-1">Secure payment via Interswitch</p>
        </div>

        {/* Job summary */}
        {job && (
          <div className="bg-muted/50 rounded-xl p-5 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Job</span>
              <span className="font-medium text-foreground text-right max-w-[60%]">{job.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Worker type</span>
              <span className="font-medium text-foreground">{job.workerId.profession}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trust score</span>
              <span className="font-semibold text-accent">{job.workerId.trustScore}/100</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-2xl font-extrabold text-foreground">
                ₦{job.price.toLocaleString('en-NG')}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Security note */}
        <div className="flex items-start gap-3 p-3 bg-accent/5 border border-accent/15 rounded-xl mb-6">
          <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A secure payment popup will open. Pay by card or bank transfer without leaving this page.
            Every payment builds this worker&apos;s verified financial record.
          </p>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={state === 'paying' || !job}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm
            hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 mb-3"
        >
          {state === 'paying' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Opening payment…
            </span>
          ) : `Pay ₦${job?.price.toLocaleString('en-NG') ?? '…'}`}
        </button>

        <button
          onClick={() => router.back()}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}