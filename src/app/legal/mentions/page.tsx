import { PublicShell } from '@/components/landing/public-shell';

export const metadata = { title: 'Mentions légales — GestHotel' };

export default function MentionsPage() {
  return (
    <PublicShell title="Mentions légales" description="Informations légales relatives à la plateforme GestHotel.">
      <article className="prose prose-slate max-w-none">
        <Section title="1. Éditeur du site">
          <p>
            Le présent site <strong>GestHotel</strong> est édité par <strong>Daniel ZEHIMA</strong>, basé à Abidjan, Côte d'Ivoire.
          </p>
          <ul>
            <li><strong>Adresse :</strong> Abidjan, Côte d'Ivoire</li>
            <li><strong>Téléphone :</strong> +225 07 10 07 52 57 / +225 05 64 14 90 92</li>
            <li><strong>Email :</strong> <a href="mailto:danielzehima@gmail.com">danielzehima@gmail.com</a></li>
            <li><strong>Directeur de la publication :</strong> Daniel ZEHIMA</li>
          </ul>
        </Section>

        <Section title="2. Hébergement">
          <p>
            Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
            La base de données est hébergée par <strong>Supabase Inc.</strong>, 970 Toa Payoh North #07-04, Singapore 318992.
          </p>
        </Section>

        <Section title="3. Propriété intellectuelle">
          <p>
            L'ensemble des contenus présents sur GestHotel (textes, images, logos, code source, design, marque) sont la propriété exclusive de Daniel ZEHIMA ou de ses partenaires, et sont protégés par le droit d'auteur et le droit des marques.
          </p>
          <p>
            Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable est strictement interdite.
          </p>
        </Section>

        <Section title="4. Données personnelles">
          <p>
            Conformément à la loi ivoirienne n°2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel, vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition aux données vous concernant.
          </p>
          <p>
            Pour exercer ce droit, contactez : <a href="mailto:danielzehima@gmail.com">danielzehima@gmail.com</a>. Voir la <a href="/legal/confidentialite">politique de confidentialité</a> pour plus de détails.
          </p>
        </Section>

        <Section title="5. Responsabilité">
          <p>
            L'éditeur s'efforce de fournir des informations exactes et à jour. Néanmoins, il ne peut être tenu responsable des erreurs ou omissions, ni des dommages directs ou indirects résultant de l'utilisation du service.
          </p>
        </Section>

        <Section title="6. Loi applicable">
          <p>
            Les présentes mentions légales sont régies par le droit ivoirien. En cas de litige, les tribunaux d'Abidjan seront seuls compétents.
          </p>
        </Section>

        <p className="text-sm text-slate-500 mt-12">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </article>
    </PublicShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">{title}</h2>
      <div className="text-slate-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
