"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PricingTier } from "@/types";
import { PriceTag } from "./PriceTag";
import { StampBadge } from "./StampBadge";

interface PricingCardProps {
  tier: PricingTier;
  className?: string;
}

export function PricingCard({ tier, className }: PricingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 12px 24px rgba(192, 57, 43, 0.15)" }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn(
        "relative p-6 bg-[#FBF4EC]",
        "[border-radius:4px_12px_6px_10px/10px_6px_12px_4px]",
        tier.featured
          ? "border-4 border-brand-red shadow-lg"
          : "border-2 border-brand-red/40",
        className
      )}
    >
      {tier.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <StampBadge>Best value</StampBadge>
        </div>
      )}
      <div className="text-center space-y-2">
        <p className="font-body text-sm text-brand-ink/60 uppercase tracking-widest">
          {tier.quantity} pieces
        </p>
        <PriceTag price={tier.price} />
        {tier.includes.length > 0 && (
          <ul className="mt-3 space-y-1">
            {tier.includes.map((item) => (
              <li key={item} className="font-body text-sm text-brand-ink/70">
                + {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
