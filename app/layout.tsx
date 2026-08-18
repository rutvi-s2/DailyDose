import "./globals.css";

export const metadata = { title: "DailyDose", description: "Daily briefings on your topics" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
