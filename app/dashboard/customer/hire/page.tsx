import HireClient from './HireClient';

export default function HirePage({
  searchParams,
}: {
  searchParams: { workerId?: string };
}) {
  const preselectedWorkerId = searchParams.workerId ?? '';

  return <HireClient preselectedWorkerId={preselectedWorkerId} />;
}