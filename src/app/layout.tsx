import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { getPublicClinicContent } from "@/lib/clinic/data";

import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * The clinic name is editable from the dashboard, so the document metadata is
 * generated from the same cached content the public pages use. It falls back to
 * the confirmed launch defaults when Supabase is not configured.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicClinicContent();

  return {
    title: {
      default: `${settings.name} — AI Receptionist & Clinic Management`,
      template: `%s · ${settings.name}`,
    },
    description:
      "A calm, considered homeopathic clinic experience. Explore services, book in-person or online consultations, and meet the Nissa AI receptionist.",
    applicationName: settings.name,
    keywords: [
      "homeopathic clinic",
      settings.name,
      "online consultation",
      "clinic appointments",
      "AI receptionist",
    ],
  };
}

export const viewport: Viewport = {
  themeColor: "#2f6b4f",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
