'use client';

// Interswitch redirects here after payment (success or failure).
// We verify the transaction reference and show result.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Status = 'verifying' | 'success' | 'failed' | 'pending';

export default function PaymentCallbackClient({ txnRef }: { txnRef: string }) {
  const router = useRouter();

  const [status, setStatus]   = useState<Status>('verifying');
  const [amount, setAmount]   = useState(0);
  const [jobId, setJobId]     = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!txnRef) { router.push('/dashboard/customer/history'); return; }

    async function verify() {
      const res  = await fetch('/api/payments/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ transactionRef: txnRef }),
      });
      const data = await res.json();

      if (data.success) {
        const p = data.data;
        setAmount(p.amount);
        setJobId(p.jobId?._id ?? p.jobId ?? '');
        setStatus(data.data.status);

        // If still pending, retry up to 4 times (Interswitch can be slightly async)
        if (data.data.status === 'pending' && attempts < 4) {
          setAttempts((n) => n + 1);
          setTimeout(verify, 3000);
        }
      } else {
        setStatus('failed');
      }
    }

    verify();
  }, [txnRef]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">

        {status === 'verifying' && (
          <>
            <svg className="w-12 h-12 animate-spin text-primary mx-auto mb-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <h2 className="text-xl font-bold text-foreground mb-2">Verifying payment…</h2>
            <p className="text-muted-foreground text-sm">Please wait while we confirm your transaction with Interswitch</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Payment successful</h2>
            <p className="text-muted-foreground text-sm mb-2">
              ₦{amount.toLocaleString('en-NG')} paid successfully
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              This payment has been recorded in the worker&apos;s financial history and trust score updated.
            </p>

            {jobId && (
              <Link
                href={`/payments/review?jobId=${jobId}`}
                className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all flex items-center justify-center mb-3"
              >
                ⭐ Leave a review for this worker
              </Link>
            )}
            <Link
              href="/dashboard/customer/history"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to my jobs
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Payment failed</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Your payment was not successful. No money has been deducted.
            </p>
            {jobId && (
              <Link
                href={`/payments/pay?jobId=${jobId}`}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center mb-3"
              >
                Try again
              </Link>
            )}
            <Link href="/dashboard/customer/history" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Back to my jobs
            </Link>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Payment pending</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Your payment is being processed. We&apos;ll update your job status automatically once it confirms.
            </p>
            <Link href="/dashboard/customer/history" className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center">
              Check job status
            </Link>
          </>
        )}
      </div>
    </div>
  );
}