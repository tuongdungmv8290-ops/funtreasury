import { useMemo } from 'react';
import { useCryptoPrices } from './useCryptoPrices';
import { useCamlyPrice } from './useCamlyPrice';

// Fallback prices used when API is unavailable
const FALLBACK_PRICES: Record<string, number> = {
  'BTC': 100000,
  'BTCB': 100000,
  'BNB': 700,
  'USDT': 1,
  'USDC': 1,
  'CAMLY': 0.000022,
};

// Map CoinGecko symbol to our token symbols
const SYMBOL_MAP: Record<string, string> = {
  'btc': 'BTC',
  'bnb': 'BNB',
  'usdt': 'USDT',
  'usdc': 'USDC',
};

/**
 * Central hook that provides realtime prices for all treasury tokens.
 * Sources: CoinGecko (BTC, BNB, USDT, USDC) + dedicated CAMLY price API.
 * Falls back to static prices if APIs are unavailable.
 */
export function useRealtimePrices(): Record<string, number> {
  const { data: cryptoPrices } = useCryptoPrices();
  const { data: camlyPriceData } = useCamlyPrice();

  return useMemo(() => {
    const prices: Record<string, number> = { ...FALLBACK_PRICES };

    // Override with CoinGecko realtime prices
    if (cryptoPrices && cryptoPrices.length > 0) {
      for (const coin of cryptoPrices) {
        const symbol = SYMBOL_MAP[coin.symbol.toLowerCase()];
        if (symbol && coin.current_price > 0) {
          prices[symbol] = coin.current_price;
        }
      }
      // BTCB always mirrors BTC price
      if (prices['BTC']) {
        prices['BTCB'] = prices['BTC'];
      }
    }

    // CAMLY price from dedicated API (most accurate)
    if (camlyPriceData?.price_usd && camlyPriceData.price_usd > 0) {
      prices['CAMLY'] = camlyPriceData.price_usd;
    }

    return prices;
  }, [cryptoPrices, camlyPriceData]);
}
