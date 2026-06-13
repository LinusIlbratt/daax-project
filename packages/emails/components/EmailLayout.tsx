import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { BRAND_NAME } from "../lib/brand";

type EmailLayoutProps = {
  preview: string;
  title: string;
  children: ReactNode;
};

export function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html lang="sv">
      <Tailwind>
        <Head />
        <Preview>{preview}</Preview>
        <Body className="bg-slate-100 font-sans">
          <Container className="mx-auto my-8 max-w-[560px] rounded-xl bg-white px-8 py-10 shadow-sm">
            <Section>
              <Text className="m-0 text-xs font-semibold uppercase tracking-wider text-amber-600">
                {BRAND_NAME}
              </Text>
              <Heading className="mt-2 text-2xl font-bold text-slate-900">
                {title}
              </Heading>
            </Section>
            <Hr className="my-6 border-slate-200" />
            {children}
            <Hr className="my-6 border-slate-200" />
            <Text className="m-0 text-xs leading-relaxed text-slate-500">
              Det här är ett automatiskt meddelande från {BRAND_NAME}. Svara inte
              på detta e-post om du inte vill kontakta oss angående din bokning.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
