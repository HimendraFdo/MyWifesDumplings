import Image from "next/image";
import type { GalleryImage } from "@/types";
import { urlFor } from "@/lib/sanity/image";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { RedDivider } from "@/components/brand/RedDivider";

interface GallerySectionProps {
  images: GalleryImage[];
}

export function GallerySection({ images }: GallerySectionProps) {
  if (images.length === 0) return null;

  return (
    <section id="gallery" className="py-16 sm:py-20 px-4 bg-brand-ink/5">
      <div className="max-w-5xl mx-auto">
        <SectionHeading subheading="Fresh from the kitchen.">
          Gallery
        </SectionHeading>

        <RedDivider className="my-8 sm:my-10" />

        {/* CSS columns masonry — degrades gracefully on all screen sizes */}
        <div className="columns-2 md:columns-3 gap-3 sm:gap-4">
          {images.map((img) => (
            <div
              key={img._id}
              className="break-inside-avoid overflow-hidden mb-3 sm:mb-4
                border-2 border-brand-red/20"
              style={{ borderRadius: "4px 12px 6px 10px / 10px 6px 12px 4px" }}
            >
              <Image
                src={urlFor(img.image).width(600).url()}
                alt={img.alt}
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              />
              {img.caption && (
                <p className="font-body text-xs text-brand-ink/60 px-2 py-1 bg-brand-cream/80">
                  {img.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
