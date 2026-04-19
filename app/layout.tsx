import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainNav from "./_components/MainNav";

const themeInitScript = `
  (() => {
    try {
      const storedTheme = window.localStorage.getItem("trakItTheme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : prefersDark
          ? "dark"
          : "light";

      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }
  })();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrakIt",
  description:
    "TrakIt is a lightweight project management system for requirements, risks, and team coordination.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-[#f4f7f5] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
          <MainNav />
          <main className="w-full px-4 py-5 md:px-6 lg:ml-68 lg:max-w-[calc(100vw-17rem)] lg:px-6 lg:py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
