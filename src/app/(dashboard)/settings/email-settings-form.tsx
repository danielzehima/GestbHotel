'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { HotelEmailSettings } from '@/lib/email';
import { updateEmailSettings } from './actions';

type Props = {
  initial?: HotelEmailSettings;
};

export function EmailSettingsForm({ initial }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? '');
  const [primaryColor, setPrimaryColor] = useState(initial?.primary_color ?? '#2563eb');
  const [hotelName, setHotelName] = useState(initial?.hotel_name_header ?? '');
  const [signature, setSignature] = useState(initial?.footer_signature ?? '');
  const [replyTo, setReplyTo] = useState(initial?.reply_to ?? '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus('idle');

    const formData = new FormData();
    formData.append('email_logo_url', logoUrl.trim());
    formData.append('email_primary_color', primaryColor);
    formData.append('email_hotel_name', hotelName.trim());
    formData.append('email_footer', signature.trim());
    formData.append('email_reply_to', replyTo.trim());

    const result = await updateEmailSettings(formData);
    setLoading(false);

    if (result.ok) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
      setError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo URL */}
      <div>
        <label htmlFor="logo_url" className="block text-sm font-medium text-slate-700 mb-2">
          Logo hôtel (URL)
        </label>
        <input
          id="logo_url"
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://exemple.com/logo.png"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">Lien public vers votre logo (PNG/JPG recommandé, max 200px hauteur)</p>
        {logoUrl && (
          <div className="mt-3 p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-3">
            <img src={logoUrl} alt="Logo preview" className="h-12 object-contain" />
            <span className="text-xs text-slate-600">Aperçu du logo</span>
          </div>
        )}
      </div>

      {/* Primary Color */}
      <div>
        <label htmlFor="primary_color" className="block text-sm font-medium text-slate-700 mb-2">
          Couleur primaire (boutons, liens)
        </label>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <input
              id="primary_color"
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#2563eb"
              pattern="^#[0-9A-Fa-f]{6}$"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">Format : #RRGGBB (hex)</p>
          </div>
          <div
            style={{ backgroundColor: primaryColor }}
            className="w-12 h-10 rounded-lg border border-slate-300"
            title={`Couleur : ${primaryColor}`}
          />
        </div>
      </div>

      {/* Hotel Name Header */}
      <div>
        <label htmlFor="hotel_name" className="block text-sm font-medium text-slate-700 mb-2">
          Nom hôtel (dans les emails)
        </label>
        <input
          id="hotel_name"
          type="text"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value.slice(0, 100))}
          maxLength={100}
          placeholder="Mon Hôtel"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">{hotelName.length}/100 caractères (optionnel)</p>
      </div>

      {/* Footer Signature */}
      <div>
        <label htmlFor="signature" className="block text-sm font-medium text-slate-700 mb-2">
          Signature footer
        </label>
        <input
          id="signature"
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value.slice(0, 200))}
          maxLength={200}
          placeholder="Au plaisir de vous revoir!"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">{signature.length}/200 caractères (optionnel)</p>
      </div>

      {/* Reply-To Email */}
      <div>
        <label htmlFor="reply_to" className="block text-sm font-medium text-slate-700 mb-2">
          Email de réponse
        </label>
        <input
          id="reply_to"
          type="email"
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
          placeholder="contact@hotel.com"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition text-sm"
        />
        <p className="text-xs text-slate-500 mt-1">Les clients peuvent répondre à cette adresse (optionnel)</p>
      </div>

      {/* Status Messages */}
      {status === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Paramètres email sauvegardés ✅
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60 transition w-full"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Enregistrement...' : '💾 Enregistrer'}
      </button>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <p className="font-semibold mb-1">ℹ️ À savoir</p>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>Les changements s'appliquent immédiatement aux nouveaux emails</li>
          <li>Laissez vide pour utiliser les valeurs par défaut GestHotel</li>
          <li>Testez un email de réservation pour vérifier que tout s'affiche correctement</li>
        </ul>
      </div>
    </form>
  );
}
