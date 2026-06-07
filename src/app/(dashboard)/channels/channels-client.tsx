'use client';

import { useState, useTransition } from 'react';
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Copy, Check,
  RefreshCw, Download, Upload, AlertTriangle, CheckCircle2, Link2, Globe
} from 'lucide-react';
import { addIcalFeed, deleteIcalFeed, toggleIcalFeed, syncNow, type SyncResult } from './actions';

type RoomType = { id: string; libelle: string };

type Feed = {
  id: string;
  nom: string;
  room_type_id: string;
  url: string;
  actif: boolean;
  derniere_sync: string | null;
  derniere_erreur: string | null;
  events_count: number;
};

type ExportLink = { roomTypeId: string; libelle: string; url: string };

// ── Bloc URL copiable ────────────────────────────────────────────────────────

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 truncate text-slate-600">
        {url}
      </code>
      <button onClick={copy}
        className="shrink-0 p-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition" title="Copier">
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
      </button>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export function ChannelsClient({
  exportLinks,
  feeds,
  roomTypes,
}: {
  exportLinks: ExportLink[];
  feeds: Feed[];
  roomTypes: RoomType[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addIcalFeed(fd);
      if (res.ok) { setShowForm(false); (e.target as HTMLFormElement).reset(); }
      else setError(res.error);
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce flux ? Les blocages importés seront aussi retirés.')) return;
    startTransition(() => { deleteIcalFeed(id); });
  }

  function handleToggle(id: string, actif: boolean) {
    startTransition(() => { toggleIcalFeed(id, !actif); });
  }

  function handleSync() {
    setSyncResult(null);
    startTransition(async () => {
      const res = await syncNow();
      setSyncResult(res);
    });
  }

  return (
    <div className="space-y-8">
      {/* ═══ EXPORT ═══ */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900">Exporter vers les OTA</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Copiez ces liens et collez-les dans Booking.com, Airbnb ou Expedia (section « Importer un calendrier »).
          Vos réservations GestHotel bloqueront automatiquement les dates sur ces plateformes.
        </p>

        {exportLinks.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Créez d'abord des types de chambres pour générer vos liens d'export.
          </div>
        ) : (
          <div className="space-y-3">
            {exportLinks.map((link) => (
              <div key={link.roomTypeId} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" /> {link.libelle}
                </p>
                <CopyableUrl url={link.url} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ IMPORT ═══ */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Importer depuis les OTA</h2>
          </div>
          <div className="flex gap-2">
            {feeds.length > 0 && (
              <button onClick={handleSync} disabled={isPending}
                className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 transition text-sm disabled:opacity-60">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Synchroniser
              </button>
            )}
            {!showForm && (
              <button onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm">
                <Plus className="w-4 h-4" /> Ajouter un flux
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Collez ici les liens iCal fournis par Booking.com / Airbnb. GestHotel bloquera ces dates pour éviter le surbooking.
        </p>

        {/* Résultat de synchro */}
        {syncResult && (
          <div className={`mb-4 rounded-xl p-3 text-sm border ${syncResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {syncResult.ok ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Synchronisation terminée.</strong>
                  {syncResult.results.length === 0 && ' Aucun flux actif.'}
                  {syncResult.results.map((r) => (
                    <div key={r.feedId} className="text-xs mt-1">
                      {r.ok
                        ? `✓ ${r.nom} : ${r.imported} importé(s), ${r.removed} retiré(s)`
                        : `✗ ${r.nom} : ${r.error}`}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span>{syncResult.error}</span>
            )}
          </div>
        )}

        {/* Formulaire d'ajout */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Plateforme *</label>
                <input name="nom" required placeholder="Ex: Booking.com" className="input" />
              </div>
              <div>
                <label className="label">Type de chambre *</label>
                <select name="room_type_id" required className="input">
                  <option value="">Choisir…</option>
                  {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.libelle}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">URL du calendrier iCal (.ics) *</label>
              <input name="url" required type="url" placeholder="https://admin.booking.com/...ics" className="input" />
              <p className="text-xs text-slate-400 mt-1">
                Trouvez ce lien dans Booking.com (Calendrier → Exporter) ou Airbnb (Disponibilités → Synchroniser les calendriers).
              </p>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={isPending}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Ajouter le flux
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition border border-slate-300">
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Liste des flux */}
        {feeds.length === 0 && !showForm ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">Aucun flux importé</p>
            <p className="text-sm text-slate-400 mt-1">Ajoutez les calendriers de vos OTA pour éviter le surbooking.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {feeds.map((feed) => {
              const rt = roomTypes.find((r) => r.id === feed.room_type_id);
              return (
                <div key={feed.id}
                  className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${feed.actif ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{feed.nom}</p>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{rt?.libelle ?? 'Type inconnu'}</span>
                      {feed.derniere_erreur ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Erreur
                        </span>
                      ) : feed.derniere_sync ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          {feed.events_count} bloc(s)
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Jamais synchronisé</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">{feed.url}</p>
                    {feed.derniere_erreur && (
                      <p className="text-xs text-red-500 mt-0.5">⚠ {feed.derniere_erreur}</p>
                    )}
                    {feed.derniere_sync && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dernière synchro : {new Date(feed.derniere_sync).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggle(feed.id, feed.actif)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition" title={feed.actif ? 'Désactiver' : 'Activer'}>
                      {feed.actif ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                    <button onClick={() => handleDelete(feed.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <style jsx global>{`
        .label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px; }
        .input { width: 100%; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.55rem 0.75rem; font-size: 0.875rem; outline: none; background: white; }
        .input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
      `}</style>
    </div>
  );
}
