"use client";

import { useState } from 'react';

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function Tab({ label, isActive, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors
        ${isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
    >
      {label}
    </button>
  );
}

interface TokenTabsProps {
  children: React.ReactNode[];
}

export function TokenTabs({ children }: TokenTabsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Token Info', 'Holders', 'Social', 'Seguridad'];

  return (
    <div className="w-full space-y-4">
      <div className="flex space-x-2 p-1 bg-muted rounded-lg">
        {tabs.map((tab, index) => (
          <Tab
            key={tab}
            label={tab}
            isActive={activeTab === index}
            onClick={() => setActiveTab(index)}
          />
        ))}
      </div>
      <div className="p-4 bg-card rounded-lg border">
        {children[activeTab]}
      </div>
    </div>
  );
}
