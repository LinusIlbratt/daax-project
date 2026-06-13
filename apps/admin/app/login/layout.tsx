export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[rgb(var(--admin-bg))]">
      {children}
    </div>
  );
}
