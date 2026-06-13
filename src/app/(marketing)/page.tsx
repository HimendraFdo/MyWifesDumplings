import { getMenuItems, getPricingTiers, getExtras, getGalleryImages, getSiteSettings } from "@/lib/sanity/queries";
import { HeroSection } from "@/components/sections/HeroSection";
import { MenuSection } from "@/components/sections/MenuSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { ContactSection } from "@/components/sections/ContactSection";

export default async function HomePage() {
  const [menuItems, pricingTiers, extras, galleryImages, settings] = await Promise.all([
    getMenuItems(),
    getPricingTiers(),
    getExtras(),
    getGalleryImages(),
    getSiteSettings(),
  ]);

  return (
    <>
      <HeroSection
        heading={settings?.heroHeading ?? "My Wife's Dumplings"}
        subheading={settings?.heroSubheading}
        heroImage={settings?.heroImage}
        orderFormUrl={settings?.orderFormUrl}
      />
      <MenuSection items={menuItems} />
      <PricingSection tiers={pricingTiers} extras={extras} orderFormUrl={settings?.orderFormUrl} />
      <AboutSection aboutText={settings?.aboutText} />
      <GallerySection images={galleryImages} />
      <ContactSection orderFormUrl={settings?.orderFormUrl} instagramUrl={settings?.instagramUrl} />
    </>
  );
}
