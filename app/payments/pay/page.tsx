import PayContent from './PayContent';

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;

  return <PayContent jobId={jobId ?? ''} />;
}