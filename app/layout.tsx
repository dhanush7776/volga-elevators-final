import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { BwProvider } from '@/lib/bw-context';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Volga Elevators — Smart Management',
  description: 'Elevator service, maintenance, and AMC management system',
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('volga-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-fixed bg-aurora">
        <BwProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'var(--color-glass-bg)',
                    color: 'var(--color-text)',
                    border: '1px solid rgba(45,212,191,0.25)',
                    backdropFilter: 'blur(12px)',
                  },
                  success: { iconTheme: { primary: '#2DD4BF', secondary: '#0A1420' } },
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </BwProvider>
      </body>
    </html>
  );
}
