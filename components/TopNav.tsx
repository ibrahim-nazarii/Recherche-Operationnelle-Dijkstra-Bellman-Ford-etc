'use client';

import React from 'react';
import { FileText, BookOpen, Search, Bot } from 'lucide-react';

export function TopNav() {
  const navItems = [
    { label: 'Brief Analysis', icon: FileText, active: false },
    { label: 'Practical Guidance', icon: BookOpen, active: false },
    { label: 'Legal Research', icon: Search, active: false },
    { label: 'AI Assistant', icon: Bot, active: true },
  ];

  return (<></>);
  }
    /*<header className="flex justify-center pt-6 pb-2">
      <div className="bg-sidebar rounded-full p-1 flex items-center border border-white/5">
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`
              flex flex-col items-center gap-1 px-6 py-2 rounded-full cursor-pointer transition-all
              ${item.active 
                ? 'bg-primary text-white shadow-lg shadow-purple-900/20' 
                : 'text-text-muted hover:text-white hover:bg-white/5'}
            `}
          >
            <item.icon size={20} />
            <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>
    </header>
  );*/
