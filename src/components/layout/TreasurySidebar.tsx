import { useState } from 'react';
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
  Users,
  LogOut,
  LogIn,
  Eye,
  User,
  Sprout,
  Gamepad2,
  Globe2,
  Wallet,
  Bot,
  GraduationCap,
  Leaf,
  Banknote,
  Newspaper,
  ShoppingBag,
  Building,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import funTreasuryLogo from '@/assets/fun-treasury-logo.png';
// Logo imports for FUN Platforms
import funProfileLogo from '@/assets/fun-profile-logo.png';
import funEcosystemLogo from '@/assets/fun-ecosystem-logo.png';
import camlyCoinGoldLogo from '@/assets/camly-coin-gold-logo.png';
import funLifeLogo from '@/assets/fun-life-logo.png';
import funAcademyLogo from '@/assets/fun-academy-logo.png';
import greenEarthLogo from '@/assets/green-earth-logo.png';
import funFarmLogo from '@/assets/fun-farm-logo.png';
import funWalletLogo from '@/assets/fun-wallet-logo.png';
import angelAiLogo from '@/assets/angel-ai-logo.png';
import funPlayLogo from '@/assets/fun-play-logo.png';
import funPlanetLogo from '@/assets/fun-planet-logo.png';

import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useViewMode } from '@/contexts/ViewModeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

// TREASURY navigation items with translation keys
const treasuryItems = [
  { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, status: 'active' },
  { path: '/transactions', labelKey: 'nav.transactions', icon: ArrowLeftRight, status: 'active' },
  { path: '/prices', labelKey: 'nav.prices', icon: TrendingUp, status: 'active' },
  { path: '/ecosystem', labelKey: 'nav.ecosystem', icon: Globe, status: 'active' },
  { path: '/camly', labelKey: 'nav.camly', icon: Coins, status: 'active' },
  { path: '/anh-sang', labelKey: 'nav.anhSang', icon: Sparkles, status: 'active' },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings, status: 'active' },
];

// FUN PLATFORMS with logo images, status, and descriptions
interface FunPlatform {
  url: string;
  labelKey: string;
  descKey: string;
  logo: string;
  fallbackIcon: LucideIcon;
  status: 'live' | 'soon';
}

// 6 Primary platforms shown by default
const primaryPlatforms: FunPlatform[] = [
  { url: 'https://fun.rich', labelKey: 'platforms.funProfile', descKey: 'platforms.funProfileDesc', logo: funProfileLogo, fallbackIcon: User, status: 'live' },
  { url: 'https://funfarm.life', labelKey: 'platforms.funFarm', descKey: 'platforms.funFarmDesc', logo: funFarmLogo, fallbackIcon: Sprout, status: 'live' },
  { url: 'https://play.fun.rich', labelKey: 'platforms.funPlay', descKey: 'platforms.funPlayDesc', logo: funPlayLogo, fallbackIcon: Gamepad2, status: 'live' },
  { url: 'https://planet.fun.rich', labelKey: 'platforms.funPlanet', descKey: 'platforms.funPlanetDesc', logo: funPlanetLogo, fallbackIcon: Globe2, status: 'live' },
  { url: 'https://funwallet-rich.lovable.app', labelKey: 'platforms.funWallet', descKey: 'platforms.funWalletDesc', logo: funWalletLogo, fallbackIcon: Wallet, status: 'live' },
  { url: 'https://angelkhanhi.fun.rich', labelKey: 'platforms.angelAi', descKey: 'platforms.angelAiDesc', logo: angelAiLogo, fallbackIcon: Bot, status: 'live' },
];

// 10 Secondary platforms (hidden by default, shown when expanded)
const secondaryPlatforms: FunPlatform[] = [
  { url: 'https://funecademy.vn', labelKey: 'platforms.funEcademy', descKey: 'platforms.funEcademyDesc', logo: funAcademyLogo, fallbackIcon: GraduationCap, status: 'live' },
  { url: 'https://angelaivan.fun.rich', labelKey: 'platforms.funGreenEarth', descKey: 'platforms.funGreenEarthDesc', logo: greenEarthLogo, fallbackIcon: Leaf, status: 'live' },
  { url: 'https://funmoney.vn', labelKey: 'platforms.funMoney', descKey: 'platforms.funMoneyDesc', logo: funLifeLogo, fallbackIcon: Banknote, status: 'live' },
  { url: 'https://camly.co', labelKey: 'platforms.camlyCoin', descKey: 'platforms.camlyCoinDesc', logo: camlyCoinGoldLogo, fallbackIcon: Heart, status: 'live' },
  { url: 'https://funnews.vn', labelKey: 'platforms.funNews', descKey: 'platforms.funNewsDesc', logo: funEcosystemLogo, fallbackIcon: Newspaper, status: 'live' },
  { url: 'https://funshop.vn', labelKey: 'platforms.funShop', descKey: 'platforms.funShopDesc', logo: funEcosystemLogo, fallbackIcon: ShoppingBag, status: 'live' },
  { url: 'https://funcommunity.vn', labelKey: 'platforms.funCommunity', descKey: 'platforms.funCommunityDesc', logo: funEcosystemLogo, fallbackIcon: Users, status: 'live' },
  { url: 'https://funtoken.vn', labelKey: 'platforms.mxhAnhSang', descKey: 'platforms.mxhAnhSangDesc', logo: funEcosystemLogo, fallbackIcon: Sparkles, status: 'live' },
  { url: 'https://fundation.co', labelKey: 'platforms.funFoundation', descKey: 'platforms.funFoundationDesc', logo: funEcosystemLogo, fallbackIcon: Building, status: 'live' },
  { url: 'https://fundgroup.space', labelKey: 'platforms.funTokenGlobal', descKey: 'platforms.funTokenGlobalDesc', logo: funEcosystemLogo, fallbackIcon: Globe, status: 'live' },
];

export function TreasurySidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isViewOnly, exitViewMode } = useViewMode();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [platformsOpen, setPlatformsOpen] = useState(false);

  const handleLogout = async () => {
    if (isViewOnly) {
      exitViewMode();
      toast.success(t('common.viewOnly') + ' - ' + t('common.logout'));
      navigate('/login');
    } else {
      await signOut();
      toast.success(t('common.logout'));
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
            {t('nav.treasury')}
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
                              {t(item.labelKey)}
                            </span>
                            {isComingSoon && (
                              <Badge
                                variant="outline"
                                className="ml-auto text-[10px] px-1.5 py-0 h-4 border-primary/40 text-primary/70"
                              >
                                {t('common.comingSoon')}
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

        {/* FUN PLATFORMS Group - Vertical list with collapsible */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            {!isCollapsed && t('nav.funPlatforms')}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <div className="space-y-1 px-1">
              {/* 6 Primary Platforms - Always visible */}
              <TooltipProvider delayDuration={200}>
                {primaryPlatforms.map((platform, index) => {
                  const FallbackIcon = platform.fallbackIcon;
                  return (
                    <Tooltip key={platform.url}>
                      <TooltipTrigger asChild>
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                     text-muted-foreground hover:text-foreground hover:bg-secondary/80
                                     transition-all duration-200 group animate-fade-in"
                          style={{ animationDelay: `${index * 0.03}s` }}
                        >
                          {/* Logo - NO BORDER */}
                          <div className="w-8 h-8 shrink-0 group-hover:scale-110 
                                          group-hover:drop-shadow-[0_0_15px_rgba(201,162,39,0.6)]
                                          transition-all duration-300">
                            <img
                              src={platform.logo}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallbackEl) fallbackEl.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-full items-center justify-center">
                              <FallbackIcon className="w-5 h-5 text-primary/60" />
                            </div>
                          </div>
                          
                          {!isCollapsed && (
                            <span className="flex-1 truncate group-hover:text-primary transition-colors">
                              {t(platform.labelKey)}
                            </span>
                          )}
                          
                          {!isCollapsed && platform.status === 'live' && (
                            <span className="text-[8px] font-bold text-green-400 bg-green-500/20 
                                             px-1.5 py-0.5 rounded border border-green-500/30">
                              LIVE
                            </span>
                          )}
                        </a>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="bg-background/95 border-primary/30 backdrop-blur-sm">
                          <p className="font-semibold text-xs text-primary">{t(platform.labelKey)}</p>
                          <p className="text-[10px] text-muted-foreground">{t(platform.descKey)}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </TooltipProvider>

              {/* Collapsible for secondary platforms */}
              <Collapsible open={platformsOpen} onOpenChange={setPlatformsOpen}>
                <CollapsibleTrigger className="flex items-center justify-center w-full px-3 py-2 rounded-lg 
                                               hover:bg-secondary/50 cursor-pointer transition-colors text-xs text-muted-foreground">
                  <ChevronDown className={cn(
                    "w-4 h-4 mr-1 transition-transform duration-300", 
                    platformsOpen && "rotate-180"
                  )} />
                  {!isCollapsed && (
                    <span>
                      {platformsOpen ? t('ecosystem.hideExtra') : `${t('ecosystem.showAll')} (+${secondaryPlatforms.length})`}
                    </span>
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 pt-1">
                  <TooltipProvider delayDuration={200}>
                    {secondaryPlatforms.map((platform, index) => {
                      const FallbackIcon = platform.fallbackIcon;
                      return (
                        <Tooltip key={platform.url}>
                          <TooltipTrigger asChild>
                            <a
                              href={platform.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                         text-muted-foreground hover:text-foreground hover:bg-secondary/80
                                         transition-all duration-200 group animate-fade-in"
                              style={{ animationDelay: `${index * 0.03}s` }}
                            >
                              {/* Logo - NO BORDER */}
                              <div className="w-8 h-8 shrink-0 group-hover:scale-110 
                                              group-hover:drop-shadow-[0_0_15px_rgba(201,162,39,0.6)]
                                              transition-all duration-300">
                                <img
                                  src={platform.logo}
                                  alt=""
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallbackEl) fallbackEl.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden w-full h-full items-center justify-center">
                                  <FallbackIcon className="w-5 h-5 text-primary/60" />
                                </div>
                              </div>
                              
                              {!isCollapsed && (
                                <span className="flex-1 truncate group-hover:text-primary transition-colors">
                                  {t(platform.labelKey)}
                                </span>
                              )}
                              
                              {!isCollapsed && platform.status === 'live' && (
                                <span className="text-[8px] font-bold text-green-400 bg-green-500/20 
                                                 px-1.5 py-0.5 rounded border border-green-500/30">
                                  LIVE
                                </span>
                              )}
                            </a>
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right" className="bg-background/95 border-primary/30 backdrop-blur-sm">
                              <p className="font-semibold text-xs text-primary">{t(platform.labelKey)}</p>
                              <p className="text-[10px] text-muted-foreground">{t(platform.descKey)}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </CollapsibleContent>
              </Collapsible>
            </div>
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
              {!isCollapsed && t('common.viewOnly')}
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
                  {t('auth.signIn')}
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
              {!isCollapsed && <span className="ml-2">{t('common.logout')}</span>}
            </Button>
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
