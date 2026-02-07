import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

function useGiftAnalytics() {
  return useQuery({
    queryKey: ['gift-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gifts')
        .select('created_at, usd_value, token_symbol, amount')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function GiftAnalyticsCharts() {
  const { data: gifts, isLoading } = useGiftAnalytics();

  const weeklyData = useMemo(() => {
    if (!gifts?.length) return [];
    const map = new Map<string, number>();
    gifts.forEach(g => {
      const d = new Date(g.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + Number(g.usd_value));
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, total]) => ({
        week: new Date(week).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        total: Math.round(total * 100) / 100,
      }));
  }, [gifts]);

  const tokenData = useMemo(() => {
    if (!gifts?.length) return [];
    const map = new Map<string, number>();
    gifts.forEach(g => {
      map.set(g.token_symbol, (map.get(g.token_symbol) || 0) + Number(g.usd_value));
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }));
  }, [gifts]);

  const cumulativeData = useMemo(() => {
    if (!gifts?.length) return [];
    let cumulative = 0;
    const sorted = [...gifts].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const points: { date: string; total: number }[] = [];
    sorted.forEach((g, i) => {
      cumulative += Number(g.usd_value);
      if (i % Math.max(1, Math.floor(sorted.length / 30)) === 0 || i === sorted.length - 1) {
        points.push({
          date: new Date(g.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          total: Math.round(cumulative * 100) / 100,
        });
      }
    });
    return points;
  }, [gifts]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
      </div>
    );
  }

  if (!gifts?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chưa có dữ liệu gift để hiển thị biểu đồ
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Weekly Volume */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">📊 Gift Volume theo tuần</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`$${v}`, 'USD']} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Token Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">🪙 Token phân bổ</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={tokenData}
                cx="50%" cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {tokenData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`$${v}`, 'USD']} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cumulative */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">📈 Tổng lũy kế</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`$${v}`, 'Tổng USD']} />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
