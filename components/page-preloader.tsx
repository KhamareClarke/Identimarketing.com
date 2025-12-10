"use client";
import React, { useEffect, useState } from "react";
import { MintedLogoPreloader } from "@/components/minted-logo-preloader";

export function PagePreloader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500">
          <MintedLogoPreloader size={280} alt="IdentiMarketing Logo Loading" />
        </div>
      )}
      <div style={{ opacity: loading ? 0 : 1, transition: "opacity 0.5s" }}>{children}</div>
    </>
  );
}
