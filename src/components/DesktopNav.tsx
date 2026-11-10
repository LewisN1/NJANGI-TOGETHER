/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Banknote, CalendarCheck, Users, Menu } from 'lucide-react';
import { useNjangi } from '../context/NjangiContext.tsx';
import { TabKey } from './BottomNav.tsx';

interface DesktopNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  pendingCount?: number;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ currentTab, onSelectTab, pendingCount = 0 }) => {
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
    <div className="hidden sm:block bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex space-x-1 sm:space-x-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectTab(item.key)}
                className={`relative inline-flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition duration-150 ${
                  isActive
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-gray-400'}`} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
