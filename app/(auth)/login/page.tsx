import LoginClient from './LoginClient';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const redirectTo = searchParams.redirect ?? '';

  return <LoginClient redirectTo={redirectTo} />;
}