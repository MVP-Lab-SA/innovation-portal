import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { Providers } from './providers';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'مركز الابتكار وحلول الأعمال',
  description: 'منصة إدارة وتحليل مبادرات الابتكار - وزارة البلديات والإسكان',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster position="bottom-left" richColors closeButton />
      </body>
    </html>
  );
}
