import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'יוצר דפי נחיתה חכם',
  description: 'מערכת ליצירת דפי נחיתה מותאמים אישית',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
