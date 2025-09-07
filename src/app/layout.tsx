import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Business SaaS App - Data Management Platform',
  description: 'Complete business data management platform with user accounts, admin controls, and Excel integration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
          </div>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}