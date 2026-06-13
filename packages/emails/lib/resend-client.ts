import { Resend } from "resend";

export type ResendConfig = {
  apiKey: string;
  from: string;
};

export function getResendConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env
): ResendConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    return null;
  }
  return { apiKey, from };
}

export function createResendClient(config: ResendConfig): Resend {
  return new Resend(config.apiKey);
}
