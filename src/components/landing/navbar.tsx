'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Hotel, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' }
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition">
            <Hotel className="w-5 h-5 text-white" />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Gest<span className="text-brand-600">Hotel</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-slate-600 hover:text-brand-700 transition"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-700 hover:text-brand-700 transition"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 shadow-sm hover:shadow transition"
          >
            Démarrer l'essai
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
          className="md:hidden p-2 text-slate-700"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <ul className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-2 border-t border-slate-100 mt-2 space-y-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-semibold bg-brand-600 text-white text-center hover:bg-brand-700"
              >
                Démarrer l'essai
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
