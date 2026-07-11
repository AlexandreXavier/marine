import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "VELA Marine — tracking de navios em tempo real",
  description:
    "Posições AIS em tempo real dos navios na costa ibérica: mapa live, detalhe de navio e diretório pesquisável.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-PT" className={`${roboto.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col font-sans bg-white text-[#1B252E]">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
