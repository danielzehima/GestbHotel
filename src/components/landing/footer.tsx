import Link from 'next/link';
import { Hotel, Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const LINKS = {
  produit: [
    { href: '#features', label: 'Fonctionnalités' },
    { href: '#pricing', label: 'Tarifs' },
    { href: '#faq', label: 'FAQ' }
  ],
  legal: [
    { href: '/legal/cgu', label: "Conditions d'utilisation" },
    { href: '/legal/confidentialite', label: 'Politique de confidentialité' },
    { href: '/legal/mentions', label: 'Mentions légales' }
  ],
  ressources: [
    { href: '/blog', label: 'Blog' },
    { href: '/aide', label: "Centre d'aide" },
    { href: '/contact', label: 'Contact' }
  ]
};

const SOCIAL = [
  { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook },
  { href: 'https://twitter.com', label: 'Twitter', Icon: Twitter },
  { href: 'https://linkedin.com', label: 'LinkedIn', Icon: Linkedin },
  { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram }
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center">
                <Hotel className="w-5 h-5 text-white" />
              </span>
              <span className="text-xl font-bold text-white">
                Gest<span className="text-brand-400">Hotel</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">
              La plateforme tout-en-un pour digitaliser et piloter votre hôtel en Afrique de l'Ouest.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Abidjan, Côte d'Ivoire</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <span>+225 07 10 07 52 57</span>
                <span>+225 05 64 14 90 92</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <a href="mailto:contact@gesthotel.app" className="hover:text-white transition">
                  danielzehima@gmail.com
                </a>
              </div>
            </div>
          </div>

          <FooterCol title="Produit" links={LINKS.produit} />
          <FooterCol title="Légal" links={LINKS.legal} />
          <FooterCol title="Ressources" links={LINKS.ressources} />
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} GestHotel. Tous droits réservés.
          </p>
          <div className="flex items-center gap-3">
            {SOCIAL.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href as any} className="text-sm text-slate-400 hover:text-white transition">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
