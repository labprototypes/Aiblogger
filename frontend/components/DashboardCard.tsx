import { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

export default function DashboardCard({ title, value, subtitle, icon, trend }: Props) {
  return (
    <div className="card p-6 hover:border-lime-400/30 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">{title}</div>
          <div className="text-3xl font-bold text-white">{value}</div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
        {icon && (
          <div className="text-4xl opacity-50">{icon}</div>
        )}
      </div>
      
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${
          trend.isPositive ? "text-green-400" : "text-red-400"
        }`}>
          <span>{trend.isPositive ? "↗" : "↘"}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-gray-500">vs last week</span>
        </div>
      )}
    </div>
  );
}
