import { useTranslation } from 'react-i18next';
import { ExternalLink, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Logo imports
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

interface Platform {
  url: string;
  labelKey: string;
  descKey: string;
  logo: string;
  status: 'live' | 'soon';
}

const platforms: Platform[] = [
  { url: 'https://fun.rich', labelKey: 'platforms.funProfile', descKey: 'platforms.funProfileDesc', logo: funProfileLogo, status: 'live' },
  { url: 'https://funfarm.life', labelKey: 'platforms.funFarm', descKey: 'platforms.funFarmDesc', logo: funFarmLogo, status: 'live' },
  { url: 'https://play.fun.rich', labelKey: 'platforms.funPlay', descKey: 'platforms.funPlayDesc', logo: funPlayLogo, status: 'live' },
  { url: 'https://planet.fun.rich', labelKey: 'platforms.funPlanet', descKey: 'platforms.funPlanetDesc', logo: funPlanetLogo, status: 'live' },
  { url: 'https://funwallet-rich.lovable.app', labelKey: 'platforms.funWallet', descKey: 'platforms.funWalletDesc', logo: funWalletLogo, status: 'live' },
  { url: 'https://angelkhanhi.fun.rich', labelKey: 'platforms.angelAi', descKey: 'platforms.angelAiDesc', logo: angelAiLogo, status: 'live' },
  { url: 'https://funecademy.vn', labelKey: 'platforms.funEcademy', descKey: 'platforms.funEcademyDesc', logo: funAcademyLogo, status: 'live' },
  { url: 'https://angelaivan.fun.rich', labelKey: 'platforms.funGreenEarth', descKey: 'platforms.funGreenEarthDesc', logo: greenEarthLogo, status: 'live' },
  { url: 'https://funmoney.vn', labelKey: 'platforms.funMoney', descKey: 'platforms.funMoneyDesc', logo: funLifeLogo, status: 'live' },
  { url: 'https://camly.co', labelKey: 'platforms.camlyCoin', descKey: 'platforms.camlyCoinDesc', logo: camlyCoinGoldLogo, status: 'live' },
  { url: 'https://funnews.vn', labelKey: 'platforms.funNews', descKey: 'platforms.funNewsDesc', logo: funEcosystemLogo, status: 'live' },
  { url: 'https://funshop.vn', labelKey: 'platforms.funShop', descKey: 'platforms.funShopDesc', logo: funEcosystemLogo, status: 'live' },
  { url: 'https://funcommunity.vn', labelKey: 'platforms.funCommunity', descKey: 'platforms.funCommunityDesc', logo: funEcosystemLogo, status: 'live' },
  { url: 'https://funtoken.vn', labelKey: 'platforms.mxhAnhSang', descKey: 'platforms.mxhAnhSangDesc', logo: funEcosystemLogo, status: 'live' },
  { url: 'https://fundation.co', labelKey: 'platforms.funFoundation', descKey: 'platforms.funFoundationDesc', logo: funEcosystemLogo, status: 'live' },
  { url: 'https://fundgroup.space', labelKey: 'platforms.funTokenGlobal', descKey: 'platforms.funTokenGlobalDesc', logo: funEcosystemLogo, status: 'live' },
];

export default function FunEcosystem() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Globe className="w-10 h-10 text-primary" />
          <h1 className="text-4xl md:text-5xl font-heading font-bold gold-text">
            {t('ecosystem.title')}
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('ecosystem.subtitle')}
        </p>
        <p className="text-lg text-primary font-medium mt-2">
          {t('ecosystem.tagline')}
        </p>
      </div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {platforms.map((platform, index) => (
          <Card
            key={platform.url}
            className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm
                       hover:border-primary/50 hover:shadow-[0_0_30px_rgba(201,162,39,0.3)]
                       transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              {/* Logo - NO BORDER */}
              <div className="relative mb-4">
                <div className="w-20 h-20 group-hover:scale-110 
                                group-hover:drop-shadow-[0_0_25px_rgba(201,162,39,0.6)]
                                transition-all duration-300">
                  <img
                    src={platform.logo}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Glow backdrop */}
                <div className="absolute inset-0 bg-primary/30 blur-2xl opacity-0 
                                group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>

              {/* Platform Name */}
              <h3 className="font-heading font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                {t(platform.labelKey)}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {t(platform.descKey)}
              </p>

              {/* Status Badge + Action */}
              <div className="flex items-center gap-3 mt-auto">
                {platform.status === 'live' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                    LIVE
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    SOON
                  </Badge>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
                  asChild
                >
                  <a href={platform.url} target="_blank" rel="noopener noreferrer">
                    {t('ecosystem.visitPlatform')}
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
