import LoginClient from './LoginClient';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const {redirect} = searchParams
  const redirectTo = redirect ?? '';

  return <LoginClient redirectTo={redirectTo} />;
}