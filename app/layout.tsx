import './globals.css';
import React from 'react';
import { Sidebar } from '@/components/Sidebar';

export const metadata = {
  title: 'FR/EU Legal Assistant',
  description: 'AI-powered legal assistant for French and EU Law',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen bg-background text-text-main overflow-hidden">
        {/* Fixed Sidebar */}
        <Sidebar />
        
        {/* Main Content Area (Offset by sidebar width) */}
        <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden relative">
          {children}
        </div>
      </body>
    </html>
  );
}
