import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-refresh-secret',
};

// Public BSC RPC endpoints that support eth_getLogs with a 5000 block range
const RPC_ENDPOINTS = [
  'https://bsc.rpc.blxrbdn.com',
];

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const CHUNK_SIZE = 5000;
const BATCH = 3;                       // concurrent block-range scans
const RUN_DEADLINE_MS = 100 * 1000;    // wall-clock budget per invocation
const MAX_BACKFILL_DEPTH = 3_500_000;  // how far back a fresh wallet is backfilled
const LOCK_KEY = 'bsc_logs_lock';
const LOCK_TTL_MS = 4 * 60 * 1000;

const TOKENS: Record<string, { symbol: string; decimals: number }> = {
  '0x0910320181889fefde0bb1ca63962b0a8882e413': { symbol: 'CAMLY', decimals: 3 },
  '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', decimals: 18 },
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': { symbol: 'BTCB', decimals: 18 },
};

// Số block quét lùi an toàn khi khởi tạo con trỏ tiến (~1 ngày trên BSC)
const FORWARD_SAFETY_BLOCKS = 30_000;

// Ngưỡng tối thiểu để loại bỏ giao dịch bụi/spam
const MIN_AMOUNT: Record<string, number> = {
  CAMLY: 100,
  USDT: 0.5,
  BTCB: 0.000001,
};

interface RpcLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
}

let rpcErrorLogged = 0;

async function rpcCall(method: string, params: unknown[]): Promise<any> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const endpoint of RPC_ENDPOINTS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
          signal: controller.signal,
        });
        const json = await res.json();
        if (json.error) {
          lastError = json.error;
          if (rpcErrorLogged < 8) {
            rpcErrorLogged++;
            console.log(`RPC ${method} error: ${JSON.stringify(json.error)}`);
          }
        } else {
          return json.result;
        }
      } catch (error) {
        lastError = error;
        if (rpcErrorLogged < 8) {
          rpcErrorLogged++;
          console.log(`RPC ${method} threw: ${error instanceof Error ? error.message : String(error)}`);
        }
      } finally {
        clearTimeout(timer);
      }
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw new Error(`RPC ${method} failed: ${JSON.stringify(lastError)}`);
}

const toHex = (n: number) => '0x' + n.toString(16);
const topicToAddress = (topic: string) => '0x' + topic.slice(26).toLowerCase();

function decodeAmount(dataHex: string, decimals: number): number {
  const raw = BigInt(dataHex && dataHex !== '0x' ? dataHex : '0x0');
  return Number(raw) / Math.pow(10, decimals);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const setSetting = (key: string, value: string) =>
    supabase.from('api_settings').upsert({ key_name: key, key_value: value }, { onConflict: 'key_name' });

  const getSetting = async (key: string): Promise<string | null> => {
    const { data } = await supabase.from('api_settings').select('key_value').eq('key_name', key).maybeSingle();
    return data?.key_value ?? null;
  };

  try {
    // ---- Single-flight lock -------------------------------------------------
    const now = Date.now();
    const lockedUntil = Number((await getSetting(LOCK_KEY)) ?? 0);
    if (lockedUntil > now) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, message: 'Đang có tiến trình đồng bộ khác chạy.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    await setSetting(LOCK_KEY, String(now + LOCK_TTL_MS));

    // ---- Prices -------------------------------------------------------------
    let camlyPrice = 0.000022;
    try {
      const priceRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-camly-price`);
      if (priceRes.ok) {
        const priceJson = await priceRes.json();
        if (priceJson?.data?.price_usd) camlyPrice = priceJson.data.price_usd;
      }
    } catch (_) { /* fallback price */ }
    const prices: Record<string, number> = { CAMLY: camlyPrice, USDT: 1, BTCB: 97000 };

    // ---- Wallets ------------------------------------------------------------
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('id, name, address, chain')
      .neq('chain', 'BTC');
    if (walletsError) throw walletsError;

    const head: number = parseInt(await rpcCall('eth_blockNumber', []), 16);
    const contracts = Object.keys(TOKENS);
    const results: any[] = [];
    let totalNew = 0;
    const runStartedAt = Date.now();
    const outOfTime = () => Date.now() - runStartedAt > RUN_DEADLINE_MS;
    const backfillers: Array<{
      name: string;
      failed?: boolean;
      done: () => boolean;
      state: () => any;
      step: () => Promise<void>;
    }> = [];

    for (const wallet of wallets ?? []) {
      if (outOfTime()) {
        results.push({ wallet: wallet.name, newTxCount: 0, deferred: true });
        continue;
      }

      const topKey = `bsc_logs_cursor_${wallet.id}`;
      const floorKey = `bsc_logs_floor_${wallet.id}`;
      const walletTopic = '0x' + '0'.repeat(24) + wallet.address.slice(2).toLowerCase();

      let top = Number((await getSetting(topKey)) ?? 0);
      let floor = Number((await getSetting(floorKey)) ?? 0);
      if (!top || top > head) {
        // Khởi tạo con trỏ tiến lùi lại một khoảng an toàn để không bỏ sót block mới
        // (lịch sử cũ do pha quét lùi đảm nhiệm)
        top = Math.max(0, head - FORWARD_SAFETY_BLOCKS);
        await setSetting(topKey, String(top));
      }
      if (!floor || floor > head) floor = head;

      // Oldest block worth scanning: history before it was already imported earlier
      const { data: syncRow } = await supabase
        .from('sync_state')
        .select('last_block_synced')
        .eq('wallet_id', wallet.id)
        .maybeSingle();
      const targetStart = Math.max(
        Number(syncRow?.last_block_synced ?? 0) || head - MAX_BACKFILL_DEPTH,
        head - MAX_BACKFILL_DEPTH
      );

      let newTxCount = 0;

      const scanRange = async (from: number, to: number): Promise<RpcLog[]> => {
        const base = { fromBlock: toHex(from), toBlock: toHex(to), address: contracts };
        const [outLogs, inLogs] = await Promise.all([
          rpcCall('eth_getLogs', [{ ...base, topics: [TRANSFER_TOPIC, walletTopic] }]),
          rpcCall('eth_getLogs', [{ ...base, topics: [TRANSFER_TOPIC, null, walletTopic] }]),
        ]);
        return [...(outLogs as RpcLog[]), ...(inLogs as RpcLog[])];
      };

      const persistLogs = async (logs: RpcLog[]) => {
        if (logs.length === 0) return;

        const blockNumbers = [...new Set(logs.map((l) => l.blockNumber))];
        const blockTimes = new Map<string, number>();
        for (const bn of blockNumbers) {
          const block = await rpcCall('eth_getBlockByNumber', [bn, false]);
          blockTimes.set(bn, parseInt(block.timestamp, 16));
        }

        const hashes = [...new Set(logs.map((l) => l.transactionHash))];
        const { data: existing } = await supabase
          .from('transactions')
          .select('tx_hash, token_symbol')
          .eq('wallet_id', wallet.id)
          .in('tx_hash', hashes);
        const existingKeys = new Set((existing ?? []).map((e) => `${e.tx_hash}_${e.token_symbol}`));

        const rows: any[] = [];
        const seen = new Set<string>();
        for (const log of logs) {
          const token = TOKENS[log.address.toLowerCase()];
          if (!token) continue;
          const amount = decodeAmount(log.data, token.decimals);
          if (amount < MIN_AMOUNT[token.symbol]) continue; // bỏ qua giao dịch bụi/spam
          const from = topicToAddress(log.topics[1]);
          const to = topicToAddress(log.topics[2]);
          const symbol = token.symbol === 'BTCB' ? 'BTC' : token.symbol;
          const key = `${log.transactionHash}_${symbol}`;
          if (existingKeys.has(key) || seen.has(key)) continue;
          seen.add(key);
          rows.push({
            tx_hash: log.transactionHash,
            wallet_id: wallet.id,
            direction: to === wallet.address.toLowerCase() ? 'IN' : 'OUT',
            token_symbol: symbol,
            token_address: log.address.toLowerCase(),
            amount,
            usd_value: amount * (prices[token.symbol] ?? 0),
            from_address: from,
            to_address: to,
            gas_fee: 0,
            status: 'success',
            block_number: parseInt(log.blockNumber, 16),
            timestamp: new Date((blockTimes.get(log.blockNumber) ?? 0) * 1000).toISOString(),
          });
        }

        if (rows.length > 0) {
          const { error: insertError } = await supabase
            .from('transactions')
            .upsert(rows, { onConflict: 'tx_hash,wallet_id', ignoreDuplicates: true });
          if (insertError) throw insertError;
          newTxCount += rows.length;
          totalNew += rows.length;
          console.log(`[${wallet.name}] inserted ${rows.length} transactions`);
        }
      };

      try {
        // ---- Phase A: forward scan (newest blocks first) ---------------------
        while (top < head && !outOfTime()) {
          const batch: Array<[number, number]> = [];
          let cursor = top;
          while (cursor < head && batch.length < BATCH) {
            const from = cursor + 1;
            const to = Math.min(from + CHUNK_SIZE - 1, head);
            batch.push([from, to]);
            cursor = to;
          }
          const logs = (await Promise.all(batch.map(([f, t]) => scanRange(f, t)))).flat();
          await persistLogs(logs);
          top = cursor;
          await setSetting(topKey, String(top));
        }
      } catch (walletError) {
        console.error(`[${wallet.name}] forward scan stopped:`, walletError instanceof Error ? walletError.message : walletError);
      }

      // ---- Phase B is executed round-robin below so every wallet advances ----
      backfillers.push({
        name: wallet.name,
        done: () => floor <= targetStart,
        state: () => ({ wallet: wallet.name, newTxCount, top, floor, targetStart, caughtUp: top >= head && floor <= targetStart }),
        step: async () => {
          const batch: Array<[number, number]> = [];
          let cursor = floor;
          while (cursor > targetStart && batch.length < BATCH) {
            const to = cursor - 1;
            const from = Math.max(targetStart, to - CHUNK_SIZE + 1);
            batch.push([from, to]);
            cursor = from;
          }
          if (batch.length === 0) return;
          const logs = (await Promise.all(batch.map(([f, t]) => scanRange(f, t)))).flat();
          await persistLogs(logs);
          floor = cursor;
          await setSetting(floorKey, String(floor));
          console.log(`[${wallet.name}] backfilled down to block ${floor} (target ${targetStart})`);
        },
      });
    }

    // ---- Round-robin backfill so all wallets progress in every run ----------
    let active = backfillers.filter((b) => !b.done());
    while (active.length > 0 && !outOfTime()) {
      for (const backfiller of active) {
        if (outOfTime()) break;
        try {
          await backfiller.step();
        } catch (stepError) {
          console.error(`[${backfiller.name}] backfill stopped:`, stepError instanceof Error ? stepError.message : stepError);
          backfiller.failed = true;
        }
      }
      active = backfillers.filter((b) => !b.done() && !b.failed);
    }

    for (const backfiller of backfillers) results.push(backfiller.state());


    await setSetting(LOCK_KEY, '0');

    if (totalNew > 0) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/get-token-balances`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-refresh-secret': Deno.env.get('AUTO_REFRESH_SECRET') ?? '',
          },
          body: JSON.stringify({ source: 'sync-bsc-logs' }),
        });
      } catch (_) { /* non blocking */ }
    }

    return new Response(
      JSON.stringify({ success: true, head, totalNewTransactions: totalNew, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    await setSetting(LOCK_KEY, '0');
    console.error('sync-bsc-logs error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
