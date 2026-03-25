import ReviewContent from './ReviewContent';

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;

  return <ReviewContent jobId={jobId ?? ''} />;
}