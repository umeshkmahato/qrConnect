import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NathConnect Admin',
  description: 'Organization and platform administration for NathConnect',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <strong>NathConnect Admin</strong>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
