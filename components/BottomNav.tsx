'use client';

import { usePathname, useRouter } from 'next/navigation';
import { HomeIcon, CompassIcon, ClockIcon, UsersIcon } from './icons';

const TABS = [
  { label: 'Home',    href: '/home',    Icon: HomeIcon    },
  { label: 'Explore', href: '/explore', Icon: CompassIcon, matchPaths: ['/explore', '/activity', '/play'] },
  { label: 'History', href: '/history', Icon: ClockIcon   },
  { label: 'Us',      href: '/us',      Icon: UsersIcon   },
];

export function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  function isActive(tab: typeof TABS[0]) {
    if (tab.matchPaths?.some(p => pathname.startsWith(p))) return true;
    return pathname === tab.href;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 flex justify-around items-center px-2 pb-safe pt-2 z-50">
      {TABS.map(tab => {
        const active = isActive(tab);
        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => router.push(tab.href)}
            className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${active ? 'text-pink-600' : 'text-gray-400'}`}
          >
            <tab.Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
