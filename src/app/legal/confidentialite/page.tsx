import { PublicShell } from '@/components/landing/public-shell';

export const metadata = { title: 'Politique de confidentialité — GestHotel' };

export default function ConfidentialitePage() {
  return (
    <PublicShell
      title="Politique de confidentialité"
      description="Comment nous collectons, utilisons et protégeons vos données personnelles."
    >
      <article className="prose prose-slate max-w-none">
        <Section title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données collectées sur GestHotel est <strong>Daniel ZEHIMA</strong>, joignable à l'adresse <a href="mailto:danielzehima@gmail.com">danielzehima@gmail.com</a>.
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Dans le cadre de l'utilisation du Service, nous collectons :</p>
          <ul>
            <li><strong>Données d'identification</strong> : nom, prénom, email, téléphone, mot de passe (chiffré)</li>
            <li><strong>Données de l'établissement</strong> : nom de l'hôtel, adresse, contact, devise</li>
            <li><strong>Données opérationnelles</strong> : clients, réservations, paiements, commandes — saisies par vous</li>
            <li><strong>Données techniques</strong> : adresse IP, navigateur, journaux de connexion (logs)</li>
            <li><strong>Données du formulaire de contact</strong> : nom, email, message</li>
          </ul>
        </Section>

        <Section title="3. Finalités du traitement">
          <p>Vos données sont traitées pour les finalités suivantes :</p>
          <ul>
            <li>Fournir et améliorer le Service</li>
            <li>Permettre la gestion de votre hôtel</li>
            <li>Vous identifier et sécuriser votre compte</li>
            <li>Répondre à vos demandes et assurer le support</li>
            <li>Émettre des factures et traiter les paiements</li>
            <li>Respecter nos obligations légales (comptabilité, fiscalité)</li>
          </ul>
        </Section>

        <Section title="4. Base légale">
          <p>Le traitement de vos données repose sur :</p>
          <ul>
            <li>L'<strong>exécution du contrat</strong> conclu lors de votre inscription</li>
            <li>Votre <strong>consentement</strong> lors du remplissage du formulaire de contact</li>
            <li>Notre <strong>intérêt légitime</strong> à améliorer et sécuriser le Service</li>
            <li>Le respect de nos <strong>obligations légales</strong></li>
          </ul>
        </Section>

        <Section title="5. Destinataires des données">
          <p>Vos données sont accessibles uniquement par :</p>
          <ul>
            <li>Vous-même et les membres de votre hôtel que vous autorisez</li>
            <li>L'équipe technique de GestHotel (support, maintenance)</li>
            <li>Nos sous-traitants techniques : <strong>Supabase</strong> (base de données), <strong>Vercel</strong> (hébergement)</li>
            <li>Les autorités administratives ou judiciaires sur réquisition légale</li>
          </ul>
          <p>
            <strong>Vos données ne sont jamais vendues à des tiers</strong> et ne sont utilisées à aucune fin publicitaire externe.
          </p>
        </Section>

        <Section title="6. Sécurité des données">
          <p>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données :
          </p>
          <ul>
            <li>Chiffrement des connexions (HTTPS / TLS)</li>
            <li>Mot de passe chiffré avec algorithme robuste</li>
            <li>Isolation des données par hôtel via <strong>Row Level Security</strong> Postgres</li>
            <li>Sauvegardes quotidiennes</li>
            <li>Accès restreint à l'équipe technique</li>
          </ul>
        </Section>

        <Section title="7. Durée de conservation">
          <ul>
            <li><strong>Compte actif</strong> : pendant toute la durée de l'abonnement</li>
            <li><strong>Compte clôturé</strong> : suppression dans les 30 jours suivant la demande</li>
            <li><strong>Données comptables</strong> : 10 ans (obligation légale)</li>
            <li><strong>Messages de contact</strong> : 3 ans</li>
          </ul>
        </Section>

        <Section title="8. Vos droits">
          <p>Conformément à la loi ivoirienne 2013-450 et au RGPD, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès</strong> à vos données personnelles</li>
            <li><strong>Droit de rectification</strong> en cas d'inexactitude</li>
            <li><strong>Droit à l'effacement</strong> (« droit à l'oubli »)</li>
            <li><strong>Droit à la portabilité</strong> : récupérer vos données au format structuré</li>
            <li><strong>Droit d'opposition</strong> au traitement</li>
            <li><strong>Droit de limitation</strong> du traitement</li>
            <li><strong>Droit de retirer votre consentement</strong> à tout moment</li>
          </ul>
          <p>
            Pour exercer ces droits, écrivez-nous à <a href="mailto:danielzehima@gmail.com">danielzehima@gmail.com</a>. Nous vous répondrons sous 30 jours.
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            GestHotel utilise uniquement des cookies <strong>strictement nécessaires</strong> au fonctionnement du Service (cookies de session pour l'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </Section>

        <Section title="10. Modification de la politique">
          <p>
            La présente politique peut être mise à jour. Les utilisateurs seront notifiés par email en cas de changement substantiel.
          </p>
        </Section>

        <Section title="11. Réclamation">
          <p>
            En cas de désaccord, vous pouvez introduire une réclamation auprès de l'<strong>Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI)</strong> compétente en matière de protection des données.
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
