'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/restaurants', label: 'Restaurants', icon: '🍽️' },
  { href: '/admin/qr-codes', label: 'QR Codes', icon: '📱' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold">Admin Dashboard</h2>
      </div>
      
      <nav className="mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                block px-4 py-2 my-1 mx-2 rounded-md transition-colors
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
              `}
            >
              <span className="inline-block w-6">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-4">
        <Link
          href="/"
          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
        >
          ← Back to Site
        </Link>
      </div>
    </aside>
  );
} 