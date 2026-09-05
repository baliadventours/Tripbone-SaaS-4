import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Sparkles, Calendar, User, MessageCircle, Home, Gift, LayoutGrid, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { useSettings } from '../lib/SettingsContext';

export default function MobileNav() {
  const location = useLocation();
  const path = location.pathname;
  const { user, profile } = useAuth();
  const { settings, builderSettings } = useSettings();

  const activePreset = settings?.mobilePreset || builderSettings?.mobilePreset || 'joytime-special';
  const isJoyTime = activePreset === 'joytime-special' || activePreset === 'default';

  const accountDestination = !user 
    ? '/login' 
    : (profile?.role === 'admin' || profile?.role === 'staff')
      ? '/admin'
      : profile?.role === 'supplier'
        ? '/supplier'
        : profile?.role === 'agent'
          ? '/agent'
          : profile?.role === 'superadmin'
            ? '/superadmin'
            : '/customer/dashboard';

  const defaultNavItems = [
    { label: 'Explore', path: '/', icon: Compass },
    { label: 'Inspire', path: '/blog', icon: Sparkles },
    { label: 'Plan', path: '/planner', icon: Calendar },
    { label: 'Chat', icon: MessageCircle, isAction: true },
    { label: 'Account', path: accountDestination, icon: User },
  ];

  const joyTimeNavItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Promotion', icon: Gift, isAction: true, actionType: 'promotion' },
    { label: 'Service', icon: LayoutGrid, isAction: true, actionType: 'service' },
    { label: 'Blog', path: '/blog', icon: BookOpen },
    { label: 'Account', path: accountDestination, icon: User },
  ];

  const navItems = isJoyTime ? joyTimeNavItems : defaultNavItems;

  const handleAction = (item: any) => {
    if (item.label === 'Chat') {
      window.dispatchEvent(new CustomEvent('chat:toggle'));
    } else if (item.actionType === 'service') {
      window.dispatchEvent(new CustomEvent('service-sheet:toggle'));
    } else if (item.actionType === 'promotion') {
      if (path === '/') {
        window.dispatchEvent(new CustomEvent('promotion:scroll'));
      } else {
        window.location.href = '/#joytime-promotion-section';
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-100 flex items-center justify-around h-[72px] px-2 pb-safe md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = !item.isAction && (path === item.path || (item.path !== '/' && path.startsWith(item.path!)));
        
        if (item.isAction) {
          return (
            <button
              key={item.label}
              onClick={() => handleAction(item)}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[64px] transition-colors",
                "text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="p-1.5 rounded-full transition-colors bg-transparent">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </button>
          );
        }

        // Redirect to login if guest and clicking protected route
        const targetPath = (!user && item.path !== '/' && item.path !== '/blog') ? '/login' : item.path!;
        
        return (
          <Link
            key={item.label}
            to={targetPath}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[64px] transition-colors",
              isActive ? (isJoyTime ? "text-sky-600" : "text-primary") : "text-gray-500 hover:text-gray-700"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-full transition-colors",
              isActive ? (isJoyTime ? "bg-sky-50" : "bg-primary/10") : "bg-transparent"
            )}>
              <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

