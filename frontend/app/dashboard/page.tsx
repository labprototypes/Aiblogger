"use client";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import DashboardCard from "../../components/DashboardCard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Stats = {
  total_tasks: number;
  tasks_this_week: number;
  completion_rate: number;
  status_distribution: Record<string, number>;
  content_type_distribution: Record<string, number>;
  tasks_over_time: Array<{ date: string; count: number }>;
  tasks_by_blogger: Record<string, number>;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6b7280",
  SETUP_READY: "#3b82f6",
  GENERATING: "#f59e0b",
  REVIEW: "#8b5cf6",
  APPROVED: "#10b981",
  PUBLISHED: "#84cc16",
};

const CONTENT_TYPE_COLORS = ["#84cc16", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.tasks.getStats();
      setStats(data);
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Загрузка статистики...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Не удалось загрузить статистику</div>
      </div>
    );
  }

  // Prepare data for charts
  const statusData = Object.entries(stats.status_distribution).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const contentTypeData = Object.entries(stats.content_type_distribution).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const bloggerData = Object.entries(stats.tasks_by_blogger).map(([name, count]) => ({
    name,
    tasks: count,
  }));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Dashboard</h1>
          <p className="text-gray-400 mt-1">Обзор всех задач и метрик</p>
        </div>
        <button
          onClick={loadStats}
          className="btn btn-secondary text-sm"
        >
          🔄 Обновить
        </button>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Всего задач"
          value={stats.total_tasks}
          icon="📝"
        />
        <DashboardCard
          title="Задач на этой неделе"
          value={stats.tasks_this_week}
          icon="📅"
        />
        <DashboardCard
          title="Процент завершения"
          value={`${stats.completion_rate}%`}
          subtitle={`${Math.round(stats.total_tasks * stats.completion_rate / 100)} из ${stats.total_tasks}`}
          icon="✅"
        />
        <DashboardCard
          title="В работе"
          value={stats.status_distribution.GENERATING || 0}
          subtitle="Генерируется контент"
          icon="⚡"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks over time */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Задачи за последние 30 дней</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.tasks_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
              />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#84cc16"
                strokeWidth={2}
                dot={{ fill: '#84cc16', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Распределение по статусам</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content type distribution */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Типы контента</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contentTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#84cc16">
                {contentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CONTENT_TYPE_COLORS[index % CONTENT_TYPE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by blogger */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Задачи по блогерам</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bloggerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="tasks" fill="#84cc16" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status breakdown table */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Детальный статус</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Статус</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Количество</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Процент</th>
              </tr>
            </thead>
            <tbody>
              {statusData.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.name] || "#6b7280" }}
                      />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 font-medium">{item.value}</td>
                  <td className="text-right py-3 px-4 text-gray-400">
                    {((item.value / stats.total_tasks) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
