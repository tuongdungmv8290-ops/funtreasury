import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NotificationCenter } from './NotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Separator } from '@/components/ui/separator';

export function AppHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const { isViewOnly } = useViewMode();
  const { t } = useTranslation();

  // Page title mapping using translations
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return t('nav.dashboard');
      case '/transactions': return t('nav.transactions');
      case '/prices': return t('nav.prices');
      case '/camly': return t('nav.camly');
      case '/anh-sang': return t('nav.anhSang');
      case '/settings': return t('nav.settings');
      default: return 'FUN Treasury';
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur-md px-4 lg:px-6">
      {/* Sidebar Trigger */}
      <SidebarTrigger className="-ml-1" />
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Page Title */}
      <h1 className="font-heading text-lg font-semibold text-foreground flex-1">
        {getPageTitle()}
      </h1>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        
        {/* Notification Center - only for logged in users, not view only */}
        {user && !isViewOnly && <NotificationCenter />}
      </div>
    </header>
  );
}
