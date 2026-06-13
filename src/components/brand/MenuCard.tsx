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
        "group relative bg-[#FBF4EC] border-2 border-brand-red p-5 cursor-pointer",
        "[border-radius:4px_12px_6px_10px/10px_6px_12px_4px]",
        "transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {item.image && (
        <div className="relative w-full aspect-square overflow-hidden rounded mb-4">
          <Image
            src={urlFor(item.image).width(400).height(400).url()}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
