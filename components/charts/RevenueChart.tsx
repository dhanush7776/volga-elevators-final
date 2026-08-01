'use client';

import { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  const [colors, setColors] = useState({
    text: '#EAFFFB',
    muted: 'rgba(255,255,255,0.6)',
    grid: 'rgba(255,255,255,0.06)',
    tooltipBg: 'rgba(10,20,32,0.95)',
    tooltipBorder: 'rgba(45,212,191,0.25)',
  });

  useEffect(() => {
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      setColors({
        text: style.getPropertyValue('--color-text').trim() || '#EAFFFB',
        muted: style.getPropertyValue('--color-muted-text').trim() || 'rgba(255,255,255,0.6)',
        grid: style.getPropertyValue('--color-glass-border').trim() || 'rgba(255,255,255,0.06)',
        tooltipBg: style.getPropertyValue('--color-bg').trim() || 'rgba(10,20,32,0.95)',
        tooltipBorder: style.getPropertyValue('--color-glass-border').trim() || 'rgba(45,212,191,0.25)',
      });
    };
    readColors();
    const observer = new MutationObserver(readColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey="month" stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: colors.text }}
          itemStyle={{ color: colors.text }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#2DD4BF" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}