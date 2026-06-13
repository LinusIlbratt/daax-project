import type { NextConfig } from "next";

function supabaseStorageRemotePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return undefined;
  try {
    const hostname = new URL(raw).hostname;
    return {
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return undefined;
  }
}

const storagePattern = supabaseStorageRemotePattern();

const config: NextConfig = {
  reactStrictMode: true,
  ...(storagePattern
    ? {
        images: {
          remotePatterns: [storagePattern],
        },
      }
    : {}),
};

export default config;
