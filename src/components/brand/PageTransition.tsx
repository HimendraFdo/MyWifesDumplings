"use client";

import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Cross-fades route content as the user navigates between marketing pages
 * (home, menu, about, order). Wrapped in MotionConfig with
 * reducedMotion="user" so every Framer Motion animation across the site
 * honours the visitor's prefers-reduced-motion setting.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
