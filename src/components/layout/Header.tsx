import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Settings, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full glass-effect shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold gold-text">FUN Treasury</span>
            <span className="text-xs text-muted-foreground -mt-1">Dashboard</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation */}
        <nav className="flex md:hidden items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
