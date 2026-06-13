import { LoginForm } from "./login-form";

type SearchParams = Record<string, string | string[] | undefined>;

function hasQueryFlag(searchParams: SearchParams, flag: string): boolean {
  const raw = searchParams.error;
  if (raw === flag) return true;
  if (Array.isArray(raw) && raw.includes(flag)) return true;
  return false;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  return (
    <LoginForm
      showConfigError={hasQueryFlag(sp, "config")}
      showUnauthorizedError={hasQueryFlag(sp, "unauthorized")}
    />
  );
}
