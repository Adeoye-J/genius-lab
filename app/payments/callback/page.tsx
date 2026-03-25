import PaymentCallbackClient from './PaymentCallbackClient';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    txnref?: string;
    transactionreference?: string;
    TransactionReference?: string;
  }>;
}) {
  const params = await searchParams;

  // Interswitch appends txnref or transactionreference to the callback URL
  const txnRef =
    params.txnref ??
    params.transactionreference ??
    params.TransactionReference ??
    '';

  return <PaymentCallbackClient txnRef={txnRef} />;
}
