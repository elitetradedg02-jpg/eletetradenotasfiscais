
import React from 'react';
import { Invoice, PaymentStatus } from '../types';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  invoices: Invoice[];
}

const Dashboard: React.FC<DashboardProps> = ({ invoices }) => {
  const today = new Date().toISOString().split('T')[0];
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const next7DaysStr = next7Days.toISOString().split('T')[0];

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === PaymentStatus.PAID).length,
    open: invoices.filter(i => i.status === PaymentStatus.OPEN).length,
    overdue: invoices.filter(i => i.status === PaymentStatus.OVERDUE).length,
    totalToPay: invoices.filter(i => i.status !== PaymentStatus.PAID).reduce((acc, i) => acc + (i.totalAmount - i.payments.reduce((pAcc, p) => pAcc + p.amount, 0)), 0),
    totalPaid: invoices.reduce((acc, i) => acc + i.payments.reduce((pAcc, p) => pAcc + p.amount, 0), 0),
    totalOverdue: invoices.filter(i => i.status === PaymentStatus.OVERDUE).reduce((acc, i) => acc + (i.totalAmount - i.payments.reduce((pAcc, p) => pAcc + p.amount, 0)), 0),
    dueToday: invoices.filter(i => i.status !== PaymentStatus.PAID && i.dueDate === today).length,
    dueNext7: invoices.filter(i => i.status !== PaymentStatus.PAID && i.dueDate > today && i.dueDate <= next7DaysStr).length,
  };

  // Monthly Evolution Data
  const monthlyData = invoices.reduce((acc: any[], inv) => {
    const month = inv.issueDate.substring(0, 7); // YYYY-MM
    const existing = acc.find(a => a.name === month);
    if (existing) {
      existing.value += inv.totalAmount;
    } else {
      acc.push({ name: month, value: inv.totalAmount });
    }
    return acc;
  }, []).sort((a, b) => a.name.localeCompare(b.name));

  // Comparison Data
  const comparisonData = [
    { name: 'Pago', value: stats.totalPaid, color: '#10b981' },
    { name: 'Em Aberto', value: stats.totalToPay - stats.totalOverdue, color: '#f59e0b' },
    { name: 'Vencido', value: stats.totalOverdue, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Financeiro</h2>
        <p className="text-slate-500 text-sm">Visão geral do fluxo de contas a pagar.</p>
      </header>

      {/* Primary Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Notas" value={stats.total} subtitle="Cadastradas" color="indigo" />
        <StatCard title="Total Pago" value={formatCurrency(stats.totalPaid)} subtitle="Quitado" color="emerald" />
        <StatCard title="Total a Pagar" value={formatCurrency(stats.totalToPay)} subtitle="Pendente" color="amber" />
        <StatCard title="Total Vencido" value={formatCurrency(stats.totalOverdue)} subtitle="Atrasado" color="rose" />
      </div>

      {/* Secondary Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusBox label="Vencendo Hoje" value={stats.dueToday} highlight={stats.dueToday > 0} color="red" />
        <StatusBox label="Próximos 7 dias" value={stats.dueNext7} highlight={stats.dueNext7 > 0} color="yellow" />
        <StatusBox label="Notas em Aberto" value={stats.open} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Evolução Mensal (R$)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Comparativo: Pago x Aberto x Vencido</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={comparisonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 ml-4">
              {comparisonData.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></div>
                  <span className="text-xs text-slate-600 font-medium">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
  };

  return (
    <div className={`p-6 rounded-xl border shadow-sm ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 font-semibold">{subtitle}</p>
    </div>
  );
};

const StatusBox = ({ label, value, highlight, color }: any) => {
  let bgColor = 'bg-white';
  let textColor = 'text-slate-900';
  
  if (highlight) {
    if (color === 'red') {
      bgColor = 'bg-red-50';
      textColor = 'text-red-700';
    } else if (color === 'yellow') {
      bgColor = 'bg-yellow-50';
      textColor = 'text-yellow-700';
    }
  }

  return (
    <div className={`flex justify-between items-center p-4 rounded-lg border border-slate-200 ${bgColor} shadow-sm transition-all`}>
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className={`text-xl font-bold ${textColor}`}>{value}</span>
    </div>
  );
};

export default Dashboard;
