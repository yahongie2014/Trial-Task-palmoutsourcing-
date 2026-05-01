import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, trend, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]} flex flex-col gap-1 transition-all hover:scale-[1.02]`}>
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</span>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {trend && <div className="text-[10px] font-medium opacity-60 italic">{trend}</div>}
    </div>
  );
};
