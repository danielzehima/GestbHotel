import { notFound } from 'next/navigation';
import {
  Hotel, MapPin, Users, BedDouble, Search, Moon, CalendarDays,
  ShieldCheck, BadgePercent, Zap, Check, Phone, Sparkles
} from 'lucide-react';
import { getPublicHotelBySlug, searchAvailability, nightsBetween } from '@/lib/availability';
import { formatMoney } from '@/lib/utils/format';
import { BookingForm } from './booking-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ hotelSlug: string }> }) {
  const { hotelSlug } = await props.params;
  const hotel = await getPublicHotelBySlug(hotelSlug);
  return { title: hotel ? `Réserver — ${hotel.nom}` : 'Réservation' };
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

type SearchParams = { arrivee?: string; depart?: string; adultes?: string; enfants?: string };

const TRUST = [
  { icon: BadgePercent, label: 'Sans commission' },
  { icon: Zap, label: 'Confirmation rapide' },
  { icon: ShieldCheck, label: 'Réservation directe sécurisée' }
];

export default async function PublicBookingPage(props: {
  params: Promise<{ hotelSlug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { hotelSlug } = await props.params;
  const sp = await props.searchParams;

  const hotel = await getPublicHotelBySlug(hotelSlug);
  if (!hotel || !hotel.actif) notFound();

  const arrivee = sp.arrivee || todayStr(0);
  const depart = sp.depart || todayStr(1);
  const adultes = Math.max(1, parseInt(sp.adultes || '2', 10) || 2);
  const enfants = Math.max(0, parseInt(sp.enfants || '0', 10) || 0);

  const hasSearch = !!sp.arrivee && !!sp.depart;
  const validRange = depart > arrivee;
  const nights = validRange ? nightsBetween(arrivee, depart) : 0;

  const results = hasSearch && validRange
    ? await searchAvailability({ hotelId: hotel.id, arrivee, depart, adultes, enfants })
    : [];

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white">
        {/* halos décoratifs */}
        <div className="absolute -right-20 -top-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-16 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        <div className="relative max-w-5xl mx-auto px-4 pt-7 pb-24 sm:pb-28">
          {/* identité hôtel */}
          <div className="flex items-center gap-3">
            {hotel.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hotel.logo_url} alt={hotel.nom} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Hotel className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{hotel.nom}</h1>
              <div className="flex items-center gap-3 text-sm text-brand-100">
                {hotel.ville && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {hotel.ville}</span>
                )}
                {hotel.telephone && (
                  <span className="hidden sm:flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {hotel.telephone}</span>
                )}
              </div>
            </div>
          </div>

          {/* accroche */}
          <div className="mt-8 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 backdrop-blur px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Réservation en ligne
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold leading-tight">
              Réservez votre séjour en quelques clics
            </h2>
            <p className="mt-2 text-brand-100 text-base sm:text-lg">
              Réservation directe sans commission — confirmation rapide par l'hôtel.
            </p>
          </div>

          {/* badges de confiance */}
          <div className="mt-6 flex flex-wrap gap-2">
            {TRUST.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full"
              >
                <Icon className="w-4 h-4 text-emerald-300" /> {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ===== CARTE DE RECHERCHE (chevauche le hero) ===== */}
      <div className="max-w-5xl mx-auto px-4 -mt-14 sm:-mt-16 relative z-10">
        <form
          method="get"
          className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 p-4 sm:p-5"
        >
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="col-span-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Arrivée
              </label>
              <input
                type="date" name="arrivee" defaultValue={arrivee} min={todayStr(0)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
              />
            </div>
            <div className="col-span-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Départ
              </label>
              <input
                type="date" name="depart" defaultValue={depart} min={todayStr(1)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <Users className="w-3.5 h-3.5" /> Adultes
              </label>
              <input
                type="number" name="adultes" defaultValue={adultes} min={1} max={20}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <Users className="w-3.5 h-3.5" /> Enfants
              </label>
              <input
                type="number" name="enfants" defaultValue={enfants} min={0} max={20}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="col-span-2 lg:col-span-1 inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-3 rounded-xl hover:bg-brand-700 active:scale-[0.99] shadow-lg shadow-brand-600/20 transition"
            >
              <Search className="w-4 h-4" /> Rechercher
            </button>
          </div>
        </form>
      </div>

      {/* ===== RÉSULTATS ===== */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {hasSearch && !validRange && (
          <p className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
            La date de départ doit être après la date d'arrivée.
          </p>
        )}

        {hasSearch && validRange && (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {results.length > 0 ? 'Chambres disponibles' : 'Disponibilités'}
              </h3>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <span className="flex items-center gap-1"><Moon className="w-4 h-4" /> {nights} nuit{nights > 1 ? 's' : ''}</span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {adultes}{enfants > 0 ? `+${enfants}` : ''}
                </span>
              </p>
            </div>

            {results.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-800">Aucune chambre disponible pour ces dates</p>
                <p className="text-sm text-slate-500 mt-1">Essayez d'autres dates ou contactez directement l'hôtel.</p>
                {hotel.telephone && (
                  <a
                    href={`tel:${hotel.telephone}`}
                    className="mt-4 inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
                  >
                    <Phone className="w-4 h-4" /> Appeler l'hôtel
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {results.map((rt) => {
                  const hasDynamicPrice = rt.prix_effectif !== rt.prix_nuit;
                  return (
                    <div
                      key={rt.id}
                      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-brand-200 transition sm:flex"
                    >
                      {/* Image */}
                      <div className="sm:w-72 lg:w-80 shrink-0 relative">
                        {rt.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={rt.photos[0]}
                            alt={rt.libelle}
                            className="w-full h-48 sm:h-full object-cover group-hover:scale-[1.02] transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 sm:h-full min-h-[180px] bg-gradient-to-br from-brand-100 to-slate-100 flex items-center justify-center">
                            <BedDouble className="w-12 h-12 text-brand-300" />
                          </div>
                        )}
                        {rt.activeRuleNames.length > 0 && (
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            {rt.activeRuleNames.map((name) => (
                              <span key={name} className="text-[11px] bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full shadow">
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900">{rt.libelle}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Users className="w-3.5 h-3.5" /> {rt.capacite_adultes} adulte{rt.capacite_adultes > 1 ? 's' : ''}
                            {rt.capacite_enfants > 0 && `, ${rt.capacite_enfants} enfant${rt.capacite_enfants > 1 ? 's' : ''}`}
                          </p>
                          {rt.description && <p className="text-sm text-slate-600 mt-2 line-clamp-3">{rt.description}</p>}
                          {rt.equipements.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {rt.equipements.slice(0, 6).map((e) => (
                                <span key={e} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3 text-emerald-500" /> {e}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1">
                            <BedDouble className="w-3.5 h-3.5" />
                            {rt.available} chambre{rt.available > 1 ? 's' : ''} disponible{rt.available > 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Prix + réservation */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-end justify-between gap-3">
                          <div>
                            {hasDynamicPrice && (
                              <span className="text-xs text-slate-400 line-through mr-1">{formatMoney(rt.prix_nuit, hotel.devise)}</span>
                            )}
                            <span className={`text-2xl font-bold ${hasDynamicPrice ? 'text-amber-600' : 'text-slate-900'}`}>
                              {formatMoney(rt.prix_effectif, hotel.devise)}
                            </span>
                            <span className="text-xs text-slate-500"> / nuit</span>
                            <div className="text-sm font-semibold text-brand-700 mt-0.5">
                              Total séjour : {formatMoney(rt.prix_total_sejour, hotel.devise)}
                            </div>
                          </div>
                          <BookingForm
                            hotelSlug={hotelSlug}
                            roomTypeId={rt.id}
                            dates={{ arrivee, depart }}
                            adultes={adultes}
                            enfants={enfants}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!hasSearch && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-800">Choisissez vos dates pour commencer</p>
            <p className="text-sm text-slate-500 mt-1">
              Sélectionnez votre arrivée, votre départ et le nombre de voyageurs ci-dessus.
            </p>
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-slate-400">
          Propulsé par <strong>GestHotel</strong>
        </footer>
      </div>
    </main>
  );
}
