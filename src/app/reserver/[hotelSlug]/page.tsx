import { notFound } from 'next/navigation';
import { Hotel, MapPin, Users, BedDouble, Search, Moon } from 'lucide-react';
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
    <main className="min-h-screen bg-gradient-to-b from-brand-50 to-white pb-16">
      {/* En-tête hôtel */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          {hotel.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hotel.logo_url} alt={hotel.nom} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <Hotel className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{hotel.nom}</h1>
            {hotel.ville && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {hotel.ville}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Réservez votre séjour</h2>
        <p className="text-slate-600 mb-5">Réservation directe, sans commission. Confirmation rapide par l'hôtel.</p>

        {/* Formulaire de recherche (GET) */}
        <form method="get" className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Arrivée</label>
            <input type="date" name="arrivee" defaultValue={arrivee} min={todayStr(0)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Départ</label>
            <input type="date" name="depart" defaultValue={depart} min={todayStr(1)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Adultes</label>
            <input type="number" name="adultes" defaultValue={adultes} min={1} max={20}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Enfants</label>
            <input type="number" name="enfants" defaultValue={enfants} min={0} max={20}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit"
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 transition">
            <Search className="w-4 h-4" /> Rechercher
          </button>
        </form>

        {/* Résultats */}
        <div className="mt-6">
          {hasSearch && !validRange && (
            <p className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
              La date de départ doit être après la date d'arrivée.
            </p>
          )}

          {hasSearch && validRange && (
            <>
              <p className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                <Moon className="w-4 h-4" /> {nights} nuit{nights > 1 ? 's' : ''} ·{' '}
                <Users className="w-4 h-4" /> {adultes} adulte{adultes > 1 ? 's' : ''}
                {enfants > 0 && `, ${enfants} enfant${enfants > 1 ? 's' : ''}`}
              </p>

              {results.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                  <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">Aucune chambre disponible pour ces dates</p>
                  <p className="text-sm text-slate-500 mt-1">Essayez d'autres dates ou contactez directement l'hôtel.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((rt) => {
                    const hasDynamicPrice = rt.prix_effectif !== rt.prix_nuit;
                    return (
                      <div key={rt.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        {rt.photos[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={rt.photos[0]} alt={rt.libelle} className="w-full h-44 object-cover" />
                        )}
                        <div className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex-1 min-w-[200px]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold text-slate-900">{rt.libelle}</h3>
                                {rt.activeRuleNames.map((name) => (
                                  <span key={name} className="text-[11px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                                    {name}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Users className="w-3.5 h-3.5" /> {rt.capacite_adultes} adulte{rt.capacite_adultes > 1 ? 's' : ''}
                                {rt.capacite_enfants > 0 && `, ${rt.capacite_enfants} enfant${rt.capacite_enfants > 1 ? 's' : ''}`}
                              </p>
                              {rt.description && <p className="text-sm text-slate-600 mt-2">{rt.description}</p>}
                              {rt.equipements.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {rt.equipements.slice(0, 6).map((e) => (
                                    <span key={e} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{e}</span>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-emerald-600 font-medium mt-2">
                                {rt.available} chambre{rt.available > 1 ? 's' : ''} disponible{rt.available > 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              {hasDynamicPrice && (
                                <div className="text-xs text-slate-400 line-through">{formatMoney(rt.prix_nuit, hotel.devise)}</div>
                              )}
                              <div className={`text-2xl font-bold ${hasDynamicPrice ? 'text-amber-600' : 'text-slate-900'}`}>
                                {formatMoney(rt.prix_effectif, hotel.devise)}
                              </div>
                              <div className="text-xs text-slate-500">/ nuit moy.</div>
                              <div className="mt-1 text-sm font-semibold text-brand-700">
                                Total : {formatMoney(rt.prix_total_sejour, hotel.devise)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
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
            <p className="text-sm text-slate-400 text-center py-8">
              Choisissez vos dates ci-dessus pour voir les chambres disponibles.
            </p>
          )}
        </div>

        <footer className="mt-12 text-center text-xs text-slate-400">
          Propulsé par <strong>GestHotel</strong>
        </footer>
      </div>
    </main>
  );
}
