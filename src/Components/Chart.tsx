import React, { useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Scale,
  CoreScaleOptions,
  Tick,
} from 'chart.js';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ChartProps {
  data: { labels: string[]; prices: number[] };
  title: string;
  style?: React.CSSProperties;
  onClose?: () => void;
}

const Chart: React.FC<ChartProps> = ({ data, title, style, onClose }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
    if (!chartContainerRef.current) return;
    if (!isFullScreen) {
      chartContainerRef.current.requestFullscreen?.();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullScreen(false);
    }
  };

  React.useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Price (USD)',
        data: data.prices,
        borderColor: '#007bff',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(0, 123, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(0, 123, 255, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#007bff',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1a1a1a',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#007bff',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toFixed(2)}`,
          title: (tooltipItems: any[]) => tooltipItems[0].label,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#aaa', maxTicksLimit: 8 },
        title: {
          display: true,
          text: 'Time',
          color: '#aaa',
          font: { size: 12, family: "'Inter', sans-serif" },
        },
      },
      y: {
        grid: { color: '#333', borderDash: [5, 5] },
        ticks: {
          color: '#aaa',
          callback: (value: string | number, _index: number, _ticks: Tick[]) => {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            return `$${numValue.toLocaleString()}`;
          },
        },
        title: {
          display: true,
          text: 'Price (USD)',
          color: '#aaa',
          font: { size: 12, family: "'Inter', sans-serif" },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div
      ref={chartContainerRef}
      style={{
        position: 'relative',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '10px',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          gap: '10px',
          zIndex: 10,
        }}
      >
        {onClose && (
          <button
            className="chart-control-btn"
            onClick={onClose}
            title="Back"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color="#fff" style={{ opacity: 0.7 }} />
          </button>
        )}
        <button
          className="chart-control-btn"
          onClick={toggleFullScreen}
          title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isFullScreen ? (
            <Minimize2 size={20} color="#fff" style={{ opacity: 0.7 }} />
          ) : (
            <Maximize2 size={20} color="#fff" style={{ opacity: 0.7 }} />
          )}
        </button>
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default Chart;