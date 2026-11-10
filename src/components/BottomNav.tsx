/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Banknote, CalendarCheck, Users, Menu } from 'lucide-react';
import { useNjangi } from '../context/NjangiContext.tsx';

export type TabKey = 'home' | 'contributions' | 'payouts' | 'members' | 'more';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, pendingCount = 0 }) => {
  const { t, isTreasurer } = useNjangi();

  const navItems = [
    { key: 'home' as TabKey, label: t.navHome, icon: Home },
    {
      key: 'contributions' as TabKey,
      label: t.navContributions,
      icon: Banknote,
      badge: isTreasurer && pendingCount > 0 ? pendingCount : null,
    },
    { key: 'payouts' as TabKey, label: t.navPayouts, icon: CalendarCheck },
    { key: 'members' as TabKey, label: t.navMembers, icon: Users },
    { key: 'more' as TabKey, label: t.navMore, icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-2 py-1 shadow-lg sm:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition duration-150 ${
                isActive
                  ? 'text-emerald-800 font-semibold bg-emerald-50/80'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
