import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Account',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-xl tracking-tight">
          Identi<span className="text-primary">marketing</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to site
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-background/70 backdrop-blur-md p-8 shadow-2xl">
            {children}
          </div>
        </div>
      </main>
      <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Identimarketing. All rights reserved.
      </footer>
    </div>
  );
}
