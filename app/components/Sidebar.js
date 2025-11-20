"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Workflow, 
  Mail, 
  MessageSquare, 
  BarChart3,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Segments', href: '/segments', icon: Target },
  { name: 'Flows', href: '/flows', icon: Workflow },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Emails', href: '/emails', icon: MessageSquare },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-56 border-r border-gray-200 bg-white h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-lg font-semibold text-gray-900">CommerceOS</h1>
      </div>
      
      <nav className="px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 mb-1 rounded-lg text-sm transition-colors
                ${isActive 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
