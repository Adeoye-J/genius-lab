import LoginClient from './LoginClient';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const {redirect} = await searchParams;
  const redirectTo = redirect ?? '';

  return <LoginClient redirectTo={redirectTo} />;
}