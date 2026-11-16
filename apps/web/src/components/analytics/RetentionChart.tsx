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
  const stageColorMap: Record<string, string> = {
    NEW: '#94A3B8',
    LEARNING: '#F59E0B',
    YOUNG: '#5B2DF5',
    MATURE: '#10B981',
  };

  const chartData = distribution.map((item) => ({
    name: item.stage,
    label: item.label,
    count: item.count,
    percentage: item.percentage,
    color: stageColorMap[item.stage] || item.color,
  }));

  return (
    <div className="w-full brutal-card p-6">
      <div className="mb-4">
        <h2 className="font-sans font-extrabold text-lg text-[#141413] dark:text-ink-ivory">
          Memory Retention Distribution
        </h2>
        <p className="text-xs font-mono font-semibold text-ink-muted dark:text-ink-pewter mt-0.5">
          Vocabulary breakdown across SuperMemo-2 retention stages
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <XAxis
              dataKey="name"
              stroke="#6B6860"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6B6860"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as (typeof chartData)[0];
                  return (
                    <div className="p-3 rounded-2xl border-2 border-[#141413] dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated shadow-brutal-xs text-xs font-mono">
                      <div className="font-extrabold mb-0.5 text-[#141413] dark:text-ink-ivory">
                        {d.label}
                      </div>
                      <div className="font-bold text-violet-brand dark:text-violet-bright">
                        {d.count} words ({d.percentage}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} stroke="#141413" strokeWidth={2}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t-2 border-[#141413]/15 dark:border-[#3A3E4C]">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="p-3 rounded-2xl border-2 border-[#141413] dark:border-[#3A3E4C] bg-canvas-cream/70 dark:bg-ink-surface text-center shadow-brutal-xs"
          >
            <div className="text-xs font-mono font-extrabold" style={{ color: item.color }}>
              {item.name}
            </div>
            <div className="text-lg font-sans font-extrabold text-[#141413] dark:text-ink-ivory">
              {item.count}
            </div>
            <div className="text-[11px] font-mono font-semibold text-ink-muted dark:text-ink-pewter">
              {item.percentage}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
