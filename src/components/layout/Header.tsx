import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Settings, Wallet, LogOut, Eye, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { NotificationCenter } from './NotificationCenter';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isViewOnly, exitViewMode } = useViewMode();

  const handleLogout = async () => {
    if (isViewOnly) {
      exitViewMode();
      toast.success('Đã thoát chế độ Chỉ Xem');
      navigate('/login');
    } else {
      await signOut();
      toast.success('Đã đăng xuất thành công');
    }
  };

  // All nav items visible to everyone
  const visibleNavItems = navItems;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/40 transition-all duration-300 ring-2 ring-primary/20 group-hover:ring-primary/40">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-heading font-bold gold-text tracking-wide">FUN Treasury</span>
            <span className="text-xs font-body text-muted-foreground -mt-1">Dashboard</span>
          </div>
        </Link>

        {/* View Only Badge */}
        {isViewOnly && (
          <Badge variant="outline" className="hidden sm:flex items-center gap-1 border-primary/50 bg-primary/10 text-primary px-3 py-1 font-body">
            <Eye className="w-3 h-3" />
            Chế độ Chỉ Xem
          </Badge>
        )}

        {/* Navigation - Sang Trọng & Giàu Có */}
        <nav className="hidden md:flex items-center gap-2 bg-secondary/60 dark:bg-secondary/40 p-2 rounded-2xl border border-border/50 shadow-sm backdrop-blur-sm">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300",
                  isActive
                    ? "bg-white dark:bg-card text-foreground shadow-lg border-2 border-primary/40 scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/80 dark:hover:bg-card/80 hover:scale-[1.01]"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isActive ? "text-primary" : "text-current"
                )} />
                <span className={cn("font-body", isActive && "gold-text")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notification Center - only for logged in users */}
          {user && !isViewOnly && <NotificationCenter />}
          
          {/* User info & Logout */}
          {user && !isViewOnly && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-sm font-body text-muted-foreground truncate max-w-[150px]">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Đăng xuất</span>
              </Button>
            </div>
          )}

          {/* View Only mode - Login button */}
          {isViewOnly && (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exitViewMode();
                  navigate('/login');
                }}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Đăng nhập Admin
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Thoát
              </Button>
            </div>
          )}

          {/* Mobile Navigation */}
          <nav className="flex md:hidden items-center gap-1 bg-secondary/50 p-1 rounded-xl">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
            {(user || isViewOnly) && (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
