import Image from "next/image";
import { cn } from "@/lib/utils";
import { MenuItem } from "@/types";
import { urlFor } from "@/lib/sanity/image";
import { StampBadge } from "./StampBadge";

interface MenuCardProps {
  item: MenuItem;
  className?: string;
}

export function MenuCard({ item, className }: MenuCardProps) {
  return (
    <article
      className={cn(
        "relative bg-[#FBF4EC] border-2 border-brand-red p-5",
        "[border-radius:4px_12px_6px_10px/10px_6px_12px_4px]",
        className
      )}
    >
      {item.image && (
        <div className="relative w-full aspect-square overflow-hidden rounded mb-4">
          <Image
            src={urlFor(item.image)
              .width(800)
              .height(800)
              .fit("crop")
              .auto("format")
              .quality(90)
              .url()}
            alt={item.name}
            fill
            quality={90}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      )}
      <h3 className="font-display text-2xl italic text-brand-ink mb-1">{item.name}</h3>
      {item.tagline && (
        <p className="font-body text-sm text-brand-ink/60 mb-3">{item.tagline}</p>
      )}
      {item.description && (
        <p className="font-body text-sm text-brand-ink/80">{item.description}</p>
      )}
      {!item.available && (
        <div className="absolute top-3 right-3">
          <StampBadge variant="outline">Sold out</StampBadge>
        </div>
      )}
    </article>
  );
}
