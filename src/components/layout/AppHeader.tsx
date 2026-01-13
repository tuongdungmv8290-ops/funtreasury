import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Separator } from '@/components/ui/separator';

// Page title mapping
const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/prices': 'Prices',
  '/charts': 'Charts',
  '/camly': 'CAMLY Coin',
  '/anh-sang': 'Ánh Sáng',
  '/settings': 'Settings',
};

export function AppHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const { isViewOnly } = useViewMode();

  const pageTitle = pageTitles[location.pathname] || 'FUN Treasury';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur-md px-4 lg:px-6">
      {/* Sidebar Trigger */}
      <SidebarTrigger className="-ml-1" />
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Page Title */}
      <h1 className="font-heading text-lg font-semibold text-foreground flex-1">
        {pageTitle}
      </h1>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        {/* Notification Center - only for logged in users, not view only */}
        {user && !isViewOnly && <NotificationCenter />}
      </div>
    </header>
  );
}
