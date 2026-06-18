import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | My Wife's Dumplings",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="paper-bg min-h-screen">{children}</div>;
}
