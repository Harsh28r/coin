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
      text: 'Chart.js Line Chart',
    },
  },
  // scales: {
  //   x: {
  //     title: {
  //       display: true,
  //     },
  //     ticks: {
  //       stepSize: 10000,
  //     },
  //   },
  //   y: {
  //     title: {
  //       display: true,
  //     },
  //   },
  // },
};

export interface IChart {
  data: { labels: string[]; prices: number[] };
  title: string;
}

const Chart: FC<IChart> = ({ data, title }) => {
  const [fetchedData, setFetchedData] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Replace with your API endpoint
      const response = await fetch('YOUR_API_ENDPOINT'); 
      const data = await response.json();
      setFetchedData(data);
    };

    fetchData();
  }, []);

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        fill: true,
        label: title,
        data: fetchedData.length > 0 ? fetchedData : data.prices,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return <Line options={options} data={chartData} />;
};

export { Chart };
