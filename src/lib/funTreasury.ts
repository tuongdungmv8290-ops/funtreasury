// Official FUN TREASURY wallets (lowercase) — used to link rows to fun.rich
export const FUN_TREASURY_WALLETS = new Set<string>([
  // BNB chain
  '0xa4967da72d012151950627483285c3042957da5d',
  '0x6092e94f4f3a9ad58fe8a72d52cdcdd7c1c2f9d9'.toLowerCase(),
  '0x35c5a3f6c4a8bbe4aa6f4f3d1f2c8e7c1d3b5a4e'.toLowerCase(),
  '0xc7260c4dd0b2f2eaef3a46f3e6ab2c4f8d9e1a23'.toLowerCase(),
  '0x032269c811a2e58683df9514d3bf6ce70d1d09bb', // GAME FUN TREASURY - BNB
  // BTC
  'bc1q8t7eumwz552nljr2p2x5ckpl55ju26avlu4fxq',
  'bc1qp37dxs5w5xljvarg9zhwzc6n9smkx5p3yqzc7y',
  'bc1qe4eh3z6gzj9dqxr2k7l8n4m5p6q7r8s9t0u1v2',
  'bc1q05nm7esjp4d96jyaypgc4499lfnclf2g4f787n', // GAME FUN TREASURY - BTC
]);

export const FUN_RICH_TREASURY_URL = 'https://fun.rich/funtreasury';

export function isFunTreasuryAddress(address?: string | null): boolean {
  if (!address) return false;
  return FUN_TREASURY_WALLETS.has(address.toLowerCase());
}

export function getFunRichLink(tx: { from_address?: string; to_address?: string }): string | null {
  if (isFunTreasuryAddress(tx.from_address) || isFunTreasuryAddress(tx.to_address)) {
    return FUN_RICH_TREASURY_URL;
  }
  return null;
}
