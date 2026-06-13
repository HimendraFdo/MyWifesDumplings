import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/brand/ScrollProgress";
import { PageTransition } from "@/components/brand/PageTransition";
import { getSiteSettings } from "@/lib/sanity/queries";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <>
      <ScrollProgress />
      <Header orderFormUrl={settings?.orderFormUrl} />
      <main className="paper-bg min-h-screen">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer instagramUrl={settings?.instagramUrl} />
    </>
  );
}
