import React, { useMemo } from 'react';

const TimelineChart = ({ data, height = 280 }) => {
  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  const maxRevenue = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.revenue), 100);
    return Math.ceil(max / 100) * 100;
  }, [chartData]);

  const maxOrders = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.orderCount), 5);
    return Math.ceil(max / 5) * 5;
  }, [chartData]);

  const points = useMemo(() => {
    if (chartData.length < 2) return { revenue: "", orders: "" };
    
    const w = 1000;
    const h = height;
    const innerW = w - margin.left - margin.right;
    const innerH = h - margin.top - margin.bottom;

    const revPoints = chartData.map((d, i) => {
      const x = margin.left + (i / (chartData.length - 1)) * innerW;
      const y = margin.top + innerH - (d.revenue / maxRevenue) * innerH;
      return `${x},${y}`;
    }).join(" ");

    const ordPoints = chartData.map((d, i) => {
      const x = margin.left + (i / (chartData.length - 1)) * innerW;
      const y = margin.top + innerH - (d.orderCount / maxOrders) * innerH;
      return `${x},${y}`;
    }).join(" ");

    return { revenue: revPoints, orders: ordPoints };
  }, [chartData, maxRevenue, maxOrders, height]);

  if (chartData.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        No timeline data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', padding: '10px 0' }}>
      <svg viewBox={`0 0 1000 ${height}`} style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
        <defs>
          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success-color)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--success-color)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ordGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(tick => (
          <line
            key={tick}
            x1={margin.left}
            y1={margin.top + (height - margin.top - margin.bottom) * tick}
            x2={1000 - margin.right}
            y2={margin.top + (height - margin.top - margin.bottom) * tick}
            stroke="var(--border-color)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
        ))}

        {/* X-Axis Labels */}
        {chartData.map((d, i) => {
          const totalPoints = chartData.length;
          // Dynamically decide how many labels to show to prevent overlap
          // We want at most ~8-10 labels across the 1000px width
          const maxLabels = 10;
          const interval = Math.ceil(totalPoints / maxLabels);
          
          const isSelectedInterval = i % interval === 0;
          const isLast = i === totalPoints - 1;
          
          // Show label if it's on interval, but skip if it's too close to the last one
          let showLabel = isSelectedInterval || isLast;
          if (isSelectedInterval && !isLast && (totalPoints - 1 - i) < (interval / 2)) {
            showLabel = false;
          }

          if (!showLabel) return null;

          // Format label: if it's a date (contains -), make it shorter
          let label = d.time;
          if (label.includes('-')) {
            const parts = label.split('-');
            if (parts.length === 3) {
              label = `${parts[2]}/${parts[1]}`; // DD/MM
            }
          }

          return (
            <text
              key={i}
              x={margin.left + (i / (chartData.length - 1)) * (1000 - margin.left - margin.right)}
              y={height - 5}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-secondary)"
              style={{ fontWeight: '500' }}
            >
              {label}
            </text>
          );
        })}

        {/* Y-Axis Labels (Revenue) */}
        <text x="5" y={margin.top - 8} fontSize="10" fill="var(--success-color)" fontWeight="bold">REVENUE (₹)</text>
        {[0, 0.5, 1].map(tick => (
          <text
            key={tick}
            x={margin.left - 10}
            y={margin.top + (height - margin.top - margin.bottom) * (1 - tick) + 4}
            textAnchor="end"
            fontSize="12"
            fill="var(--success-color)"
          >
            {Math.round(maxRevenue * tick)}
          </text>
        ))}

        {/* Revenue Area & Line */}
        <polyline
          fill="url(#revGradient)"
          points={`${margin.left},${height - margin.bottom} ${points.revenue} ${1000 - margin.right},${height - margin.bottom}`}
        />
        <polyline
          fill="none"
          stroke="var(--success-color)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.revenue}
        />

        {/* Orders Area & Line */}
        <polyline
          fill="url(#ordGradient)"
          points={`${margin.left},${height - margin.bottom} ${points.orders} ${1000 - margin.right},${height - margin.bottom}`}
        />
        <polyline
          fill="none"
          stroke="var(--primary-color)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.orders}
        />
        
        {/* Legend */}
        <g transform={`translate(${1000 - 160}, 5)`}>
            <rect width="140" height="42" fill="var(--bg-primary)" fillOpacity="0.8" rx="8" />
            <g transform="translate(10, 10)">
              <rect width="12" height="12" fill="var(--success-color)" rx="2" />
              <text x="18" y="10" fontSize="12" fill="var(--text-secondary)" fontWeight="500">Revenue (₹)</text>
              <rect y="20" width="12" height="12" fill="var(--primary-color)" rx="2" />
              <text x="18" y="30" fontSize="12" fill="var(--text-secondary)" fontWeight="500">Orders</text>
            </g>
        </g>
      </svg>
    </div>
  );
};

export default TimelineChart;
