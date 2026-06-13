import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSiteSettings } from "@/lib/sanity/queries";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <>
      <Header orderFormUrl={settings?.orderFormUrl} />
      <main className="paper-bg min-h-screen">{children}</main>
      <Footer instagramUrl={settings?.instagramUrl} />
    </>
  );
}
