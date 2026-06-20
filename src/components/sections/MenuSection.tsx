import type { MenuItem } from "@/types";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { MenuCard } from "@/components/brand/MenuCard";
import { RedDivider } from "@/components/brand/RedDivider";
import { DynamicScatter } from "@/components/brand/DynamicScatter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface MenuSectionProps {
  items: MenuItem[];
}

const FALLBACK_ITEMS: MenuItem[] = [
  {
    _id: "pnc",
    name: "Pork n Chives",
    slug: { current: "pork-n-chives" },
    tagline: "pork mince, chives, fried egg, ginger",
    available: true,
  },
  {
    _id: "pncab",
    name: "Pork n Cabbage",
    slug: { current: "pork-n-cabbage" },
    tagline: "pork mince, cabbage, ginger, sesame",
    available: true,
  },
];

export function MenuSection({ items }: MenuSectionProps) {
  const displayItems = items.length > 0 ? items : FALLBACK_ITEMS;

  return (
    <section id="menu" className="relative py-16 sm:py-20 px-4 overflow-x-clip">
      {/* Dynamic scatter — graphics dotted across the menu, not just the edges */}
      <DynamicScatter variant="menu" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <ScrollReveal>
          <SectionHeading subheading="Every dumpling is made fresh, by hand, with love.">
            The Menu
          </SectionHeading>
        </ScrollReveal>

        <RedDivider className="my-8 sm:my-10" />

        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {displayItems.map((item, i) => (
            <ScrollReveal key={item._id} delay={i * 120}>
              <MenuCard item={item} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
