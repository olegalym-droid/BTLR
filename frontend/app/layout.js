import "./globals.css";

export const metadata = {
  title: "BTLR",
  description: "Service marketplace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
