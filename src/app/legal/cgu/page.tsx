import { PublicShell } from '@/components/landing/public-shell';

export const metadata = { title: "Conditions d'utilisation — GestHotel" };

export default function CGUPage() {
  return (
    <PublicShell
      title="Conditions Générales d'Utilisation"
      description="Les règles qui régissent l'utilisation de la plateforme GestHotel."
    >
      <article className="prose prose-slate max-w-none">
        <Section title="Article 1 — Objet">
          <p>
            Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions d'utilisation de la plateforme GestHotel (ci-après « le Service ») accessible à l'adresse <strong>gesthotel.app</strong>.
          </p>
          <p>
            Toute inscription au Service emporte acceptation pleine et entière des présentes CGU.
          </p>
        </Section>

        <Section title="Article 2 — Description du Service">
          <p>
            GestHotel est une solution SaaS multi-tenant de gestion hôtelière permettant aux établissements d'assurer :
          </p>
          <ul>
            <li>La gestion des chambres et des réservations</li>
            <li>La gestion du restaurant (carte, QR, commandes, cuisine)</li>
            <li>La gestion du personnel et des tâches d'entretien</li>
            <li>La facturation et l'encaissement (Mobile Money, cartes bancaires)</li>
            <li>L'édition de rapports et tableaux de bord</li>
          </ul>
        </Section>

        <Section title="Article 3 — Inscription et compte utilisateur">
          <p>
            L'accès au Service est conditionné à la création d'un compte utilisateur. L'utilisateur s'engage à fournir des informations exactes, complètes et à jour, et à les actualiser en cas de changement.
          </p>
          <p>
            L'utilisateur est seul responsable de la confidentialité de ses identifiants. Toute action effectuée depuis son compte est réputée effectuée par lui.
          </p>
        </Section>

        <Section title="Article 4 — Période d'essai gratuit">
          <p>
            Une période d'essai gratuit de <strong>21 jours</strong> est offerte à tout nouvel utilisateur, sans engagement et sans carte bancaire requise.
          </p>
          <p>
            À l'issue de cette période, l'utilisateur peut souscrire à l'un des plans payants ou continuer avec le plan gratuit limité.
          </p>
          <p>
            Les chercheurs académiques et administrations publiques peuvent demander un accès gratuit illimité sur justificatif en écrivant à <a href="mailto:danielzehima@gmail.com">danielzehima@gmail.com</a>.
          </p>
        </Section>

        <Section title="Article 5 — Tarifs et paiement">
          <p>
            Les tarifs des plans payants sont indiqués sur la page <a href="/#pricing">Tarification</a> et libellés en FCFA. Ils sont susceptibles d'être modifiés avec un préavis de 30 jours.
          </p>
          <p>
            Le paiement s'effectue mensuellement par Mobile Money (Wave, Orange Money, MTN Money, Moov Money), CinetPay ou carte bancaire (Visa, Mastercard). Tout abonnement est sans engagement et résiliable à tout moment.
          </p>
        </Section>

        <Section title="Article 6 — Obligations de l'utilisateur">
          <p>L'utilisateur s'engage à :</p>
          <ul>
            <li>Utiliser le Service dans le respect des lois en vigueur</li>
            <li>Ne pas porter atteinte aux droits de tiers</li>
            <li>Ne pas tenter de contourner les mesures de sécurité du Service</li>
            <li>Ne pas diffuser de contenus illicites, diffamatoires ou injurieux</li>
            <li>Conserver la confidentialité de ses identifiants</li>
          </ul>
        </Section>

        <Section title="Article 7 — Propriété intellectuelle">
          <p>
            Le Service, son design, son code source, sa marque et tous les contenus qu'il propose sont la propriété exclusive de l'éditeur. Toute reproduction non autorisée est interdite.
          </p>
          <p>
            Les données saisies par l'utilisateur (clients, réservations, factures…) restent la propriété exclusive de l'utilisateur. Il peut les exporter à tout moment.
          </p>
        </Section>

        <Section title="Article 8 — Disponibilité et maintenance">
          <p>
            L'éditeur s'efforce d'assurer une disponibilité du Service de 99,5 %. Des interruptions peuvent survenir pour des opérations de maintenance ou en cas de force majeure.
          </p>
        </Section>

        <Section title="Article 9 — Limitation de responsabilité">
          <p>
            L'éditeur ne peut être tenu responsable des dommages indirects résultant de l'utilisation du Service (perte de données, perte de chiffre d'affaires, etc.). Sa responsabilité totale est limitée aux sommes effectivement versées par l'utilisateur au cours des 12 derniers mois.
          </p>
        </Section>

        <Section title="Article 10 — Résiliation">
          <p>
            L'utilisateur peut résilier son compte à tout moment depuis l'espace Paramètres. L'éditeur peut suspendre ou résilier un compte en cas de violation des présentes CGU, après notification.
          </p>
        </Section>

        <Section title="Article 11 — Modification des CGU">
          <p>
            L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email au moins 15 jours avant l'entrée en vigueur des modifications.
          </p>
        </Section>

        <Section title="Article 12 — Loi applicable et juridiction">
          <p>
            Les présentes CGU sont régies par le droit ivoirien. Tout litige relatif à leur exécution ou interprétation sera soumis aux tribunaux d'Abidjan.
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
