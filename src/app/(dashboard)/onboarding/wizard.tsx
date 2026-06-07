'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Hotel, BedDouble, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, ExternalLink, Copy, Check, Globe
} from 'lucide-react';
import { saveOnboardingHotel, saveOnboardingRoom, completeOnboarding } from './actions';

// ── Types ──────────────────────────────────────────────────────────────────

type HotelData = {
  nom: string;
  slug: string;
  ville: string;
  email: string;
  telephone: string;
};

type Props = {
  initialHotel: HotelData;
  appUrl: string;
};

// ── Composant principal ────────────────────────────────────────────────────

export function OnboardingWizard({ initialHotel, appUrl }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [hotel, setHotel] = useState<HotelData>(initialHotel);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const bookingUrl = `${appUrl}/reserver/${hotel.slug || 'votre-hotel'}`;

  // ── Étape 1 : Hôtel ─────────────────────────────────────────────────────

  function StepHotel() {
    const [nom, setNom] = useState(hotel.nom);
    const [slug, setSlug] = useState(hotel.slug);
    const [ville, setVille] = useState(hotel.ville);
    const [email, setEmail] = useState(hotel.email);
    const [telephone, setTelephone] = useState(hotel.telephone);
    const [slugManual, setSlugManual] = useState(false);

    function toSlug(str: string) {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);
    }

    function handleNomChange(v: string) {
      setNom(v);
      if (!slugManual) setSlug(toSlug(v));
    }

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError('');
      const fd = new FormData();
      fd.set('nom', nom);
      fd.set('slug', slug);
      fd.set('ville', ville);
      fd.set('email', email);
      fd.set('telephone', telephone);

      startTransition(async () => {
        const res = await saveOnboardingHotel(fd);
        if (!res.ok) { setError(res.error); return; }
        setHotel({ nom, slug, ville, email, telephone });
        setStep(2);
      });
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nom de l'hôtel <span className="text-red-500">*</span>
          </label>
          <input
            value={nom}
            onChange={(e) => handleNomChange(e.target.value)}
            required
            placeholder="Ex: Hôtel Le Palmier"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Identifiant URL (slug) <span className="text-red-500">*</span>
          </label>
          <input
            value={slug}
            onChange={(e) => { setSlugManual(true); setSlug(toSlug(e.target.value)); }}
            required
            placeholder="le-palmier"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {slug && (
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              Page de réservation :&nbsp;
              <span className="text-brand-600 font-medium">
                {appUrl}/reserver/<strong>{slug}</strong>
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
            <input
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Ex: Abidjan"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
            <input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+225 07 00 00 00"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email de l'hôtel</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@monhotel.com"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-slate-400 mt-1">Utilisé pour recevoir les notifications de réservation.</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Suivant <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    );
  }

  // ── Étape 2 : Chambre ────────────────────────────────────────────────────

  function StepRoom() {
    const [libelle, setLibelle] = useState('Chambre Standard');
    const [type, setType] = useState('double');
    const [capacite, setCapacite] = useState(2);
    const [prix, setPrix] = useState('');
    const [numero, setNumero] = useState('101');

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError('');
      const fd = new FormData();
      fd.set('libelle', libelle);
      fd.set('type', type);
      fd.set('capacite_adultes', String(capacite));
      fd.set('prix_nuit', prix);
      fd.set('numero_chambre', numero);

      startTransition(async () => {
        const res = await saveOnboardingRoom(fd);
        if (!res.ok) { setError(res.error); return; }

        // Marquer l'onboarding terminé
        const done = await completeOnboarding();
        if (!done.ok) { setError(done.error); return; }

        setStep(3);
      });
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm text-brand-700">
          💡 Vous pourrez ajouter d'autres types de chambres et chambres depuis le menu <strong>Chambres</strong>.
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nom du type de chambre <span className="text-red-500">*</span>
          </label>
          <input
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            required
            placeholder="Ex: Chambre Standard, Suite Deluxe…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="simple">Simple</option>
              <option value="double">Double</option>
              <option value="twin">Twin</option>
              <option value="suite">Suite</option>
              <option value="familiale">Familiale</option>
              <option value="deluxe">Deluxe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacité (adultes)</label>
            <input
              type="number"
              min={1} max={10}
              value={capacite}
              onChange={(e) => setCapacite(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prix / nuit (FCFA) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              required
              placeholder="25000"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              N° de la 1ère chambre <span className="text-red-500">*</span>
            </label>
            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
              placeholder="101"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setError(''); setStep(1); }}
            className="inline-flex items-center gap-1.5 px-4 py-3 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Terminer la configuration <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    );
  }

  // ── Étape 3 : Succès ─────────────────────────────────────────────────────

  function StepSuccess() {
    const [copied, setCopied] = useState(false);

    function copyLink() {
      navigator.clipboard.writeText(bookingUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }

    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            🎉 Votre hôtel est prêt !
          </h3>
          <p className="text-slate-600">
            <strong>{hotel.nom}</strong> est configuré. Votre page de réservation en ligne est déjà active.
          </p>
        </div>

        {/* Lien booking */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Votre lien de réservation
          </p>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-sm font-medium text-brand-700 truncate bg-white border border-slate-200 rounded-lg px-3 py-2">
              {bookingUrl}
            </span>
            <button
              onClick={copyLink}
              className="shrink-0 p-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition"
              title="Copier le lien"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            </button>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 p-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition"
              title="Ouvrir"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-2">Partagez ce lien à vos clients pour qu'ils réservent en ligne.</p>
        </div>

        {/* Prochaines étapes suggérées */}
        <div className="text-left space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prochaines étapes suggérées</p>
          {[
            { href: '/rooms', label: 'Ajouter d\'autres chambres et types', icon: '🛏️' },
            { href: '/reservations/new', label: 'Créer votre première réservation', icon: '📅' },
            { href: '/settings', label: 'Personnaliser vos emails clients', icon: '✉️' },
          ].map(({ href, label, icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition text-sm text-slate-700"
            >
              <span>{icon}</span>
              <span className="flex-1">{label}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </a>
          ))}
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-brand-700 transition"
        >
          Accéder au tableau de bord <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Rendu principal ──────────────────────────────────────────────────────

  const steps = [
    { num: 1, label: "L'hôtel", icon: Hotel },
    { num: 2, label: 'Chambres', icon: BedDouble },
    { num: 3, label: 'Terminé !', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Hotel className="w-4 h-4" /> GestHotel
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Configuration de votre hôtel</h1>
          <p className="text-slate-500 mt-2">2 minutes pour être prêt à recevoir des réservations.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-slate-200 text-slate-400'}`}>
                    {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-brand-700' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mb-4 mx-1 transition-all ${step > s.num ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Informations de l'hôtel</h2>
              <p className="text-sm text-slate-500 mb-6">Ces infos apparaîtront sur vos factures et votre page de réservation.</p>
              <StepHotel />
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Votre première chambre</h2>
              <p className="text-sm text-slate-500 mb-6">Configurez un type de chambre et ajoutez votre première chambre.</p>
              <StepRoom />
            </>
          )}
          {step === 3 && <StepSuccess />}
        </div>
      </div>
    </div>
  );
}
