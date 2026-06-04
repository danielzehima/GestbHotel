import { Navbar } from './navbar';
import { Footer } from './footer';

export function PublicShell({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="pt-32 pb-12 sm:pt-36 sm:pb-16 bg-gradient-to-b from-brand-50/60 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {description && (
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">{description}</p>
            )}
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  );
}
