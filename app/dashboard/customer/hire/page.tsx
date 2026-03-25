import HireClient from './HireClient';

export default async function HirePage({
  searchParams,
}: {
  searchParams: { workerId?: string };
}) {

  const {workerId} = await searchParams
  const preselectedWorkerId = workerId ?? '';

  return <HireClient preselectedWorkerId={preselectedWorkerId} />;
}