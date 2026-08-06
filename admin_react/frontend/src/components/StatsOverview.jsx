import React from 'react';
import { Package, AlertTriangle, DollarSign } from 'lucide-react';

const StatsOverview = ({ stats, loading }) => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

      const statCards = [
        {
          id: 'total-stock',
          label: 'Total Stock Items',
          value: stats.total_items,
          icon: Package,
          iconBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-300/20',
          badgeBg: 'bg-indigo-500/10 text-indigo-600',
        },
        {
          id: 'low-stock',
          label: 'Low Stock Alert',
          value: stats.low_stock_count,
          icon: AlertTriangle,
          iconBg: 'bg-amber-500/10 text-amber-600 border-amber-300/20',
          badgeBg: stats.low_stock_count > 0 ? 'bg-amber-500/20 text-amber-600 font-semibold' : 'bg-slate-200 text-slate-500',
          subtext: 'Items < 10 units',
        },
        {
          id: 'total-valuation',
          label: 'Total Valuation',
          value: formatCurrency(stats.total_valuation),
          icon: DollarSign,
          iconBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-300/20',
          badgeBg: 'bg-emerald-500/10 text-emerald-600',
        },
      ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {statCards.map((card) => {
        const IconComponent = card.icon;
        return (
            <div
              key={card.id}
              className="relative overflow-hidden rounded-xl bg-white border border-slate-200 p-5 shadow-lg backdrop-blur-sm hover:border-slate-300 transition-all duration-200"
            >
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                    {card.label}
                  </p>
                {loading ? (
                  <div className="h-8 w-24 bg-slate-200 animate-pulse rounded my-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {card.value}
                  </h3>
                )}
                {card.subtext && !loading && (
                  <p className="text-xs text-amber-600/80 mt-1 flex items-center gap-1 font-medium">
                    {card.subtext}
                  </p>
                )}
              </div>
              <div
                className={`p-3 rounded-lg border ${card.iconBg} flex items-center justify-center`}
              >
                <IconComponent className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsOverview;
