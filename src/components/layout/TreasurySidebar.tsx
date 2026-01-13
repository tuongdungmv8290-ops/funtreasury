import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Coins,
  Sparkles,
  Settings,
  ExternalLink,
  Globe,
  Heart,
  Rocket,
  Users,
  Map,
  Home,
  Building,
  Star,
  LogOut,
  LogIn,
  Eye,
} from 'lucide-react';
import funTreasuryLogo from '@/assets/fun-treasury-logo.png';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

// TREASURY navigation items
const treasuryItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, status: 'active' },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight, status: 'active' },
  { path: '/prices', label: 'Prices', icon: TrendingUp, status: 'active' },
  
  { path: '/camly', label: 'CAMLY Coin', icon: Coins, status: 'active' },
  { path: '/anh-sang', label: 'Ánh Sáng', icon: Sparkles, status: 'active' },
  { path: '/settings', label: 'Settings', icon: Settings, status: 'active' },
];

// FUN PLATFORMS external links
const funPlatforms = [
  { url: 'https://funtoken.vn', label: 'funtoken.vn', icon: Globe },
  { url: 'https://camly.co', label: 'camly.co', icon: Heart },
  { url: 'https://fundgroup.space', label: 'fundgroup.space', icon: Rocket },
  { url: 'https://funtoken.co', label: 'funtoken.co', icon: Coins },
  { url: 'https://fundgroup.co', label: 'fundgroup.co', icon: Users },
  { url: 'https://fundland.co', label: 'fundland.co', icon: Map },
  { url: 'https://funland.vn', label: 'funland.vn', icon: Home },
  { url: 'https://fundation.co', label: 'fundation.co', icon: Building },
  { url: 'https://fangtay.com', label: 'fangtay.com', icon: Star },
];

export function TreasurySidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isViewOnly, exitViewMode } = useViewMode();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-border/50">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-border/50 p-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg shadow-primary/40 group-hover:shadow-[0_0_25px_rgba(201,162,39,0.6)] transition-all duration-300">
              <img
                src={funTreasuryLogo}
                alt="FUN Treasury Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 -z-10 w-12 h-12 rounded-full bg-primary/30 blur-lg" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-heading font-bold gold-text tracking-wide">
                FUN Treasury
              </span>
              <span className="text-[10px] font-body text-muted-foreground -mt-0.5">
                A Treasury of the Universe
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* TREASURY Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
            Treasury
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {treasuryItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isComingSoon = item.status === 'coming-soon';

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                          active
                            ? 'bg-primary/15 text-primary border-l-4 border-primary shadow-[0_0_15px_rgba(201,162,39,0.3)]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80',
                          isComingSoon && 'opacity-60'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-5 h-5 shrink-0 transition-colors',
                            active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />
                        {!isCollapsed && (
                          <>
                            <span className={cn(active && 'gold-text font-semibold')}>
                              {item.label}
                            </span>
                            {isComingSoon && (
                              <Badge
                                variant="outline"
                                className="ml-auto text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary/70"
                              >
                                Soon
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* FUN PLATFORMS Group */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
            FUN Platforms
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {funPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <SidebarMenuItem key={platform.url}>
                    <SidebarMenuButton asChild>
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200 group"
                      >
                        <Icon className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{platform.label}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                          </>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with user info */}
      <SidebarFooter className="border-t border-border/50 p-4">
        {isViewOnly ? (
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="w-full justify-center gap-1 border-primary/50 bg-primary/10 text-primary py-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              {!isCollapsed && 'Chế độ Chỉ Xem'}
            </Badge>
            {!isCollapsed && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exitViewMode();
                    navigate('/login');
                  }}
                  className="flex-1 text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  Đăng nhập
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        ) : user ? (
          <div className="space-y-2">
            {!isCollapsed && (
              <p className="text-xs text-muted-foreground truncate px-1">
                {user.email}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={cn(
                'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                isCollapsed ? 'w-full justify-center' : 'w-full justify-start'
              )}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span className="ml-2">Đăng xuất</span>}
            </Button>
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
