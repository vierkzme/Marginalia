import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export interface RetentionStageItem {
  stage: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RetentionChartProps {
  distribution: RetentionStageItem[];
}

export const RetentionChart: React.FC<RetentionChartProps> = ({ distribution }) => {
  const chartData = distribution.map((item) => ({
    name: item.stage,
    label: item.label,
    count: item.count,
    percentage: item.percentage,
    color: item.color,
  }));

  return (
    <div className="w-full rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-light dark:bg-ink-dark p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="font-serif font-bold text-lg text-ink-charcoal dark:text-ink-ivory">
          Memory Retention Distribution
        </h3>
        <p className="text-xs font-mono text-ink-graphite dark:text-ink-pewter mt-0.5">
          Vocabulary breakdown across SuperMemo-2 retention stages
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as typeof chartData[0];
                  return (
                    <div className="p-2.5 rounded-lg border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-light dark:bg-ink-elevated shadow-lg text-xs font-mono">
                      <div className="font-bold mb-1">{d.label}</div>
                      <div>{d.count} words ({d.percentage}%)</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-[#E7E2D8] dark:border-[#262930]">
        {distribution.map((item) => (
          <div key={item.stage} className="p-2 rounded bg-paper-cream/60 dark:bg-ink-elevated/60 text-center">
            <div className="text-xs font-mono font-semibold" style={{ color: item.color }}>
              {item.stage}
            </div>
            <div className="text-base font-serif font-bold text-ink-charcoal dark:text-ink-ivory">
              {item.count}
            </div>
            <div className="text-[10px] font-mono text-ink-graphite dark:text-ink-pewter">
              {item.percentage}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
