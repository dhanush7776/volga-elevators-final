'use client';

import { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#F59E0B', '#0EA5E9', '#2DD4BF', '#6B7280'];

export default function ComplaintChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const [colors, setColors] = useState({
    text: '#EAFFFB',
    tooltipBg: 'rgba(10,20,32,0.95)',
    tooltipBorder: 'rgba(45,212,191,0.25)',
  });

  useEffect(() => {
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      setColors({
        text: style.getPropertyValue('--color-text').trim() || '#EAFFFB',
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
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
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
        <Legend wrapperStyle={{ fontSize: 12, color: colors.text }} />
      </PieChart>
    </ResponsiveContainer>
  );
}