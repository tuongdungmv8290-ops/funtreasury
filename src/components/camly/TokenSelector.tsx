import { useState, useMemo } from "react";
import { Check, ChevronDown, Search, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatNumber";
import { TokenInfo, WBNB_ADDRESS } from "@/hooks/usePancakeSwap";
import { CAMLY_CONTRACT } from "@/hooks/useCamlyWallet";
import camlyLogo from "@/assets/camly-coin-gold-logo.png";

// Real token logo URLs from CoinGecko/TrustWallet
const TOKEN_LOGO_URLS: Record<string, string> = {
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  WBNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  BUSD: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png',
  BTCB: 'https://assets.coingecko.com/coins/images/14108/small/Binance-bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  CAKE: 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo_%28200%29.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  TRX: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
  FTM: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png',
  AAVE: 'https://assets.coingecko.com/coins/images/12645/small/aave-token-round.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  FIL: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
  INJ: 'https://assets.coingecko.com/coins/images/12882/small/Secondary_Symbol.png',
  SUI: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
  APT: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
  SEI: 'https://assets.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png',
  WLD: 'https://assets.coingecko.com/coins/images/31069/small/worldcoin.jpeg',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  DAI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
  FDUSD: 'https://assets.coingecko.com/coins/images/31079/small/firstfigital.jpeg',
  TUSD: 'https://assets.coingecko.com/coins/images/3449/small/tusd.png',
  FLOKI: 'https://assets.coingecko.com/coins/images/16746/small/PNG_image.png',
  ARB: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  OP: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
};

// Pre-defined popular tokens on BSC (38+ tokens)
export const POPULAR_TOKENS: TokenInfo[] = [
  { symbol: 'BNB', name: 'BNB', address: 'BNB', decimals: 18 },
  { symbol: 'CAMLY', name: 'Camly Coin', address: CAMLY_CONTRACT, decimals: 18 },
  { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
  { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
  { symbol: 'BTCB', name: 'Bitcoin BEP2', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18 },
  { symbol: 'ETH', name: 'Ethereum', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18 },
  { symbol: 'WBNB', name: 'Wrapped BNB', address: WBNB_ADDRESS, decimals: 18 },
  { symbol: 'CAKE', name: 'PancakeSwap', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18 },
  { symbol: 'XRP', name: 'Ripple', address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', decimals: 18 },
  { symbol: 'ADA', name: 'Cardano', address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', decimals: 18 },
  { symbol: 'DOGE', name: 'Dogecoin', address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', decimals: 8 },
  { symbol: 'DOT', name: 'Polkadot', address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402', decimals: 18 },
  { symbol: 'LINK', name: 'Chainlink', address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', decimals: 18 },
  { symbol: 'UNI', name: 'Uniswap', address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', decimals: 18 },
  { symbol: 'MATIC', name: 'Polygon', address: '0xCC42724C6683B7E57334c4E856f4c9965ED682bD', decimals: 18 },
  { symbol: 'SHIB', name: 'Shiba Inu', address: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D', decimals: 18 },
  { symbol: 'LTC', name: 'Litecoin', address: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94', decimals: 18 },
  { symbol: 'AVAX', name: 'Avalanche', address: '0x1CE0c2827e2eF14D5C4f29a091d735A204794041', decimals: 18 },
  { symbol: 'TRX', name: 'TRON', address: '0x85EAC5Ac2F758618dFa09bDbe0cf174e7d574D5B', decimals: 6 },
  { symbol: 'ATOM', name: 'Cosmos', address: '0x0Eb3a705fc54725037CC9e008bDede697f62F335', decimals: 18 },
  { symbol: 'FTM', name: 'Fantom', address: '0xAD29AbB318791D579433D831ed122aFeAf29dcfe', decimals: 18 },
  { symbol: 'AAVE', name: 'Aave', address: '0xfb6115445Bff7b52FeB98650C87f44907E58f802', decimals: 18 },
  { symbol: 'SOL', name: 'Solana', address: '0x570A5D26f7765Ecb712C0924E4De545B89fD43dF', decimals: 18 },
  { symbol: 'PEPE', name: 'Pepe', address: '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00', decimals: 18 },
  { symbol: 'FIL', name: 'Filecoin', address: '0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153', decimals: 18 },
  { symbol: 'INJ', name: 'Injective', address: '0xa2B726B1145A4773F68cBA6974Cd534699a0206D', decimals: 18 },
  { symbol: 'SUI', name: 'Sui', address: '0x1Ae369A6AB222aFf166325B7b87EB9aF06C86E57', decimals: 9 },
  { symbol: 'APT', name: 'Aptos', address: '0x0b079b33B6e72311c6BE245F9F660CC385029fC3', decimals: 8 },
  { symbol: 'SEI', name: 'Sei', address: '0x23cE9e926048273eF83be0A3A8Ba9Cb6D45cd978', decimals: 18 },
  { symbol: 'WLD', name: 'Worldcoin', address: '0x163f8C2467924be0ae7B5347228CABF260318753', decimals: 18 },
  { symbol: 'NEAR', name: 'NEAR Protocol', address: '0x1Fa4a73a3F0133f0025378af00236f3aBDEE5D63', decimals: 18 },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18 },
  { symbol: 'FDUSD', name: 'First Digital USD', address: '0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409', decimals: 18 },
  { symbol: 'TUSD', name: 'TrueUSD', address: '0x14016E85a25aeb13065688cAFB43044C2ef86784', decimals: 18 },
  { symbol: 'FLOKI', name: 'Floki', address: '0xfb5B838b6cfEEdC2873aB27866079AC55363D37E', decimals: 9 },
  { symbol: 'ARB', name: 'Arbitrum', address: '0xa050FFb3eEb8200eEB7F61ce34FF644420FD3522', decimals: 18 },
  { symbol: 'OP', name: 'Optimism', address: '0x170C84E3b1d282F9628229836086716141995200', decimals: 18 },
];

interface TokenBalance {
  [address: string]: number;
}

interface TokenSelectorProps {
  selectedToken: TokenInfo | null;
  onSelectToken: (token: TokenInfo) => void;
  excludeToken?: TokenInfo | null;
  tokenBalances?: TokenBalance;
  disabled?: boolean;
}

// Token Logo component with fallback
function TokenLogo({ symbol, size = 32 }: { symbol: string; size?: number }) {
  const [hasError, setHasError] = useState(false);

  // Use local CAMLY logo
  if (symbol === 'CAMLY') {
    return (
      <div 
        className="rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <img
          src={camlyLogo}
          alt={symbol}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const logoUrl = TOKEN_LOGO_URLS[symbol];

  if (!logoUrl || hasError) {
    // Fallback to initial letter
    return (
      <div 
        className="rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="font-bold text-foreground" style={{ fontSize: size * 0.4 }}>
          {symbol.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="rounded-full overflow-hidden bg-muted flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <img
        src={logoUrl}
        alt={symbol}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export function TokenSelector({
  selectedToken,
  onSelectToken,
  excludeToken,
  tokenBalances = {},
  disabled = false,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTokens = useMemo(() => {
    let tokens = POPULAR_TOKENS;

    // Exclude selected token from the other selector
    if (excludeToken) {
      tokens = tokens.filter(t => t.address.toLowerCase() !== excludeToken.address.toLowerCase());
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      tokens = tokens.filter(t => 
        t.symbol.toLowerCase().includes(searchLower) ||
        t.name.toLowerCase().includes(searchLower) ||
        t.address.toLowerCase().includes(searchLower)
      );
    }

    return tokens;
  }, [excludeToken, search]);

  const getBalance = (token: TokenInfo) => {
    return tokenBalances[token.address] ?? 0;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between min-w-[140px] h-12",
            "border-primary/30 hover:border-primary/50",
            "bg-background/50"
          )}
        >
          {selectedToken ? (
            <div className="flex items-center gap-2">
              <TokenLogo symbol={selectedToken.symbol} size={24} />
              <span className="font-medium">{selectedToken.symbol}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className="w-4 h-4" />
              <span>Chọn token</span>
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Tìm token hoặc nhập địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>Không tìm thấy token</CommandEmpty>
            <CommandGroup heading={`${filteredTokens.length} tokens khả dụng`}>
              {filteredTokens.map((token) => (
                <CommandItem
                  key={token.address}
                  value={token.symbol}
                  onSelect={() => {
                    onSelectToken(token);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="flex items-center justify-between py-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <TokenLogo symbol={token.symbol} size={32} />
                    <div>
                      <p className="font-medium">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">{token.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getBalance(token) > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(getBalance(token), { maxDecimals: 4 })}
                      </span>
                    )}
                    {selectedToken?.address === token.address && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
