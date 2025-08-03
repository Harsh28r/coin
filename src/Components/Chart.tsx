// src/Components/Chart.tsx
import { FC, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

export interface IChart {
  data: { labels: string[]; prices: number[] };
  title: string;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
      text: 'Crypto Price Chart',
    },
  },
};

const Chart: FC<IChart> = ({ data, title }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        fill: true,
        label: title,
        data: data.prices,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return <Line options={options} data={chartData} />;
};

export { Chart };
