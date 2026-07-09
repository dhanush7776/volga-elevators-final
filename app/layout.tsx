import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Volga Elevators — Smart Management',
  description: 'Elevator service, maintenance, and AMC management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-950 bg-aurora-gradient bg-fixed">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(15,30,46,0.95)',
                color: '#EAFFFB',
                border: '1px solid rgba(45,212,191,0.25)',
                backdropFilter: 'blur(12px)',
              },
              success: { iconTheme: { primary: '#2DD4BF', secondary: '#0A1420' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
