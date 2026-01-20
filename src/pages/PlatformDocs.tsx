import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Layers, 
  Database, 
  Shield, 
  Globe, 
  Rocket,
  Code,
  Users,
  Wallet,
  Image,
  Sparkles,
  BarChart3,
  Settings,
  ArrowLeftRight,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import funTreasuryLogo from '@/assets/fun-treasury-logo.png';

export default function PlatformDocs() {
  const { t } = useTranslation();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    techStack: false,
    features: false,
    database: false,
    edgeFunctions: false,
    security: false,
    i18n: false,
    roadmap: false
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast.success(t('transactions.copied'));
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const techStack = [
    { name: 'React', version: '18.3.1', category: 'Frontend', description: t('docs.tech.react') },
    { name: 'Vite', version: '5.x', category: 'Build', description: t('docs.tech.vite') },
    { name: 'TypeScript', version: '5.x', category: 'Language', description: t('docs.tech.typescript') },
    { name: 'Tailwind CSS', version: '3.x', category: 'Styling', description: t('docs.tech.tailwind') },
    { name: 'shadcn/ui', version: 'Latest', category: 'UI', description: t('docs.tech.shadcn') },
    { name: 'TanStack Query', version: '5.83.0', category: 'State', description: t('docs.tech.tanstack') },
    { name: 'Lovable Cloud', version: '-', category: 'Backend', description: t('docs.tech.supabase') },
    { name: 'ethers.js', version: '6.16.0', category: 'Blockchain', description: t('docs.tech.ethers') },
    { name: 'i18next', version: '25.7.4', category: 'i18n', description: t('docs.tech.i18next') },
    { name: 'Recharts', version: '2.15.4', category: 'Charts', description: t('docs.tech.recharts') },
  ];

  const features = [
    { 
      icon: BarChart3, 
      title: 'Dashboard', 
      path: '/', 
      status: 'active',
      description: t('docs.features.dashboard')
    },
    { 
      icon: ArrowLeftRight, 
      title: 'Transactions', 
      path: '/transactions', 
      status: 'active',
      description: t('docs.features.transactions')
    },
    { 
      icon: Wallet, 
      title: 'CAMLY Community', 
      path: '/camly', 
      status: 'active',
      description: t('docs.features.camly')
    },
    { 
      icon: Sparkles, 
      title: 'Light of Love', 
      path: '/anh-sang', 
      status: 'active',
      description: t('docs.features.anhsang')
    },
    { 
      icon: Image, 
      title: 'NFT Gallery', 
      path: '/nft', 
      status: 'active',
      description: t('docs.features.nft')
    },
    { 
      icon: BarChart3, 
      title: 'DeFi / Prices', 
      path: '/prices', 
      status: 'active',
      description: t('docs.features.prices')
    },
    { 
      icon: Settings, 
      title: 'Settings', 
      path: '/settings', 
      status: 'active',
      description: t('docs.features.settings')
    },
  ];

  const databaseTables = [
    { name: 'wallets', description: t('docs.db.wallets'), columns: 'id, name, address, chain' },
    { name: 'tokens', description: t('docs.db.tokens'), columns: 'id, wallet_id, symbol, balance, usd_value' },
    { name: 'transactions', description: t('docs.db.transactions'), columns: 'id, wallet_id, tx_hash, direction, amount, token_symbol, timestamp' },
    { name: 'tx_metadata', description: t('docs.db.txMetadata'), columns: 'id, transaction_id, category, note, tags' },
    { name: 'nft_collections', description: t('docs.db.nftCollections'), columns: 'id, name, symbol, chain, floor_price' },
    { name: 'nft_assets', description: t('docs.db.nftAssets'), columns: 'id, collection_id, name, rarity, price_camly' },
    { name: 'user_roles', description: t('docs.db.userRoles'), columns: 'id, user_id, role' },
    { name: 'api_settings', description: t('docs.db.apiSettings'), columns: 'id, key_name, key_value' },
    { name: 'notifications', description: t('docs.db.notifications'), columns: 'id, title, type, read' },
  ];

  const edgeFunctions = [
    { name: 'get-camly-price', description: t('docs.edge.getCamlyPrice') },
    { name: 'get-camly-trades', description: t('docs.edge.getCamlyTrades') },
    { name: 'get-crypto-prices', description: t('docs.edge.getCryptoPrices') },
    { name: 'get-token-balances', description: t('docs.edge.getTokenBalances') },
    { name: 'get-nft-data', description: t('docs.edge.getNftData') },
    { name: 'sync-transactions', description: t('docs.edge.syncTransactions') },
  ];

  const roadmapItems = [
    { priority: 'high', items: [
      { title: 'i18n CamlyWalletPanel', done: false },
      { title: 'i18n TokenomicsSection', done: false },
      { title: 'i18n PhilosophyComparison', done: false },
      { title: 'Bitcoin Wallet Sync', done: false },
    ]},
    { priority: 'medium', items: [
      { title: 'Excel/PDF Export', done: false },
      { title: 'Monthly Reports', done: false },
      { title: 'Portfolio Snapshots', done: false },
      { title: 'More NFT Collections', done: false },
    ]},
    { priority: 'future', items: [
      { title: 'PWA Enhanced', done: false },
      { title: 'Multi-chain Support', done: false },
      { title: 'DeFi Integration', done: false },
      { title: 'Tax Reporting', done: false },
    ]},
  ];

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  const SectionHeader = ({ 
    icon: Icon, 
    title, 
    section, 
    badge 
  }: { 
    icon: React.ElementType; 
    title: string; 
    section: string;
    badge?: string;
  }) => (
    <CollapsibleTrigger 
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        {badge && <Badge variant="outline" className="ml-2">{badge}</Badge>}
      </div>
      {openSections[section] ? (
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      )}
    </CollapsibleTrigger>
  );

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full overflow-hidden gold-shimmer-border animate-treasury-glow-pulse">
            <img src={funTreasuryLogo} alt="FUN Treasury" className="w-full h-full object-cover" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold gold-text mb-4">
            {t('docs.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('docs.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            React 18.3.1
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            TypeScript
          </Badge>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            Lovable Cloud
          </Badge>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            9 {t('docs.languages')}
          </Badge>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Vision Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('docs.vision')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {t('docs.visionText')}
          </p>
          <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm italic text-primary">
              "{t('docs.philosophy')}"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* Tech Stack */}
        <Collapsible open={openSections.techStack} onOpenChange={() => toggleSection('techStack')}>
          <SectionHeader icon={Layers} title={t('docs.techStackTitle')} section="techStack" badge={`${techStack.length} items`} />
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {techStack.map((tech) => (
                <div key={tech.name} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tech.name}</span>
                      <Badge variant="secondary" className="text-xs">{tech.version}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{tech.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{tech.category}</Badge>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Features */}
        <Collapsible open={openSections.features} onOpenChange={() => toggleSection('features')}>
          <SectionHeader icon={Rocket} title={t('docs.featuresTitle')} section="features" badge={`${features.length} ${t('docs.active')}`} />
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.path} className="flex items-start gap-3 p-4 rounded-lg bg-card border">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{feature.title}</span>
                        <Badge className="bg-green-500/20 text-green-400 text-xs">{t('common.live')}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                      <code className="text-xs text-primary mt-2 block">{feature.path}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Database Schema */}
        <Collapsible open={openSections.database} onOpenChange={() => toggleSection('database')}>
          <SectionHeader icon={Database} title={t('docs.databaseTitle')} section="database" badge={`${databaseTables.length} tables`} />
          <CollapsibleContent>
            <div className="p-4 space-y-2">
              {databaseTables.map((table) => (
                <div key={table.name} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                  <code className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-mono">
                    {table.name}
                  </code>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{table.description}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 font-mono">{table.columns}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(table.name, table.name)}
                  >
                    {copiedItem === table.name ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Edge Functions */}
        <Collapsible open={openSections.edgeFunctions} onOpenChange={() => toggleSection('edgeFunctions')}>
          <SectionHeader icon={Code} title={t('docs.edgeFunctionsTitle')} section="edgeFunctions" badge={`${edgeFunctions.length} functions`} />
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              {edgeFunctions.map((fn) => (
                <div key={fn.name} className="p-3 rounded-lg bg-card border">
                  <code className="text-primary font-mono text-sm">{fn.name}</code>
                  <p className="text-xs text-muted-foreground mt-1">{fn.description}</p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Security */}
        <Collapsible open={openSections.security} onOpenChange={() => toggleSection('security')}>
          <SectionHeader icon={Shield} title={t('docs.securityTitle')} section="security" />
          <CollapsibleContent>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t('docs.security.auth')}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>• Email/Password (Lovable Cloud Auth)</p>
                    <p>• 2FA Support (TOTP)</p>
                    <p>• Session Management</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t('docs.security.access')}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>• Admin Mode: Full CRUD</p>
                    <p>• View Only Mode: Read-only</p>
                    <p>• RLS Policies</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* i18n */}
        <Collapsible open={openSections.i18n} onOpenChange={() => toggleSection('i18n')}>
          <SectionHeader icon={Globe} title={t('docs.i18nTitle')} section="i18n" badge="9 languages" />
          <CollapsibleContent>
            <div className="p-4">
              <div className="flex flex-wrap gap-3">
                {languages.map((lang) => (
                  <div key={lang.code} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="font-medium text-sm">{lang.name}</p>
                      <code className="text-xs text-muted-foreground">{lang.code}</code>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {t('docs.i18nNote')}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Roadmap */}
        <Collapsible open={openSections.roadmap} onOpenChange={() => toggleSection('roadmap')}>
          <SectionHeader icon={Rocket} title={t('docs.roadmapTitle')} section="roadmap" />
          <CollapsibleContent>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {roadmapItems.map((group) => (
                <Card key={group.priority}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Badge variant={
                        group.priority === 'high' ? 'destructive' : 
                        group.priority === 'medium' ? 'default' : 
                        'secondary'
                      }>
                        {t(`docs.priority.${group.priority}`)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.title} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${item.done ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                        <span className={item.done ? 'line-through text-muted-foreground' : ''}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Footer */}
      <Separator className="my-8" />
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('docs.footer')}
        </p>
        <div className="flex justify-center gap-4">
          <a 
            href="https://funecosystem.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline text-sm"
          >
            FUN Ecosystem <ExternalLink className="w-3 h-3" />
          </a>
          <a 
            href="https://camly.co" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline text-sm"
          >
            CAMLY Coin <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-primary/70 italic">
          "{t('anhsang.mainQuote')}"
        </p>
      </div>
    </div>
  );
}
