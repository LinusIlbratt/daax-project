"use client";

import { createContext, useContext, useState, useCallback } from "react";

type MobileMenuContextValue = {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  toggle: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export function useMobileMenu() {
  const ctx = useContext(MobileMenuContext);
  return ctx ?? { mobileOpen: false, setMobileOpen: () => {}, toggle: () => {} };
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = useCallback(() => setMobileOpen((o) => !o), []);

  return (
    <MobileMenuContext.Provider value={{ mobileOpen, setMobileOpen, toggle }}>
      {children}
    </MobileMenuContext.Provider>
  );
}
