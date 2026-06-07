import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { Pricing } from '@/components/landing/pricing';
import { FAQ } from '@/components/landing/faq';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

// La page d'accueil utilise cookies() via getPlanPrices() → rendu dynamique obligatoire
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return (
    <>
      <Navbar />
      <main className="bg-white overflow-x-hidden scroll-smooth">
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
