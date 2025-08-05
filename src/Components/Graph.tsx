import React, { useEffect, useState } from 'react';
import Chart  from './Chart';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';

interface ChartComponentProps {
  labelsChart: string[];
  dataChart: string[];
  name: string;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ labelsChart, dataChart, name }) => {
  const [historicalData, setHistoricalData] = useState<{ labels: string[]; prices: number[] } | null>(null);

  useEffect(() => {
    const fetchData = async (crypto: any) => {
      try {
        // Fetching 24-hour historical data
        const response = await fetch(`https://api.coincap.io/v2/assets/${crypto.id}/history?interval=h1`);
        const data = await response.json();
        const prices = data.data.map((item: any) => item.priceUsd);
        const labels = data.data.map((item: any) => new Date(item.time).toLocaleTimeString());
        setHistoricalData({ labels, prices });

        return { labels, prices };
      } catch (error) {
        console.error('Error fetching 24-hour data:', error);
      }
    };

    fetchData({ id: 'ethereum' }); // Fetching data for Ethereum
  }, []);

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">
            <FontAwesomeIcon icon={faChartLine} className="me-2" />
            {name} Chart
          </h3>
        </div>
        <div className="card-body">
          <h5 className="card-title">Historical Data</h5>
          {/* <Chart 
            labelsChart={historicalData ? historicalData.labels : labelsChart}
            dataChart={historicalData ? historicalData.prices.map(price => price.toString()) : dataChart}
            name={name}
          /> */}
          <button className="btn btn-success mt-3">Refresh Data</button>
        </div>
        <div className="card-footer text-muted">
          Data fetched from CoinCap API
        </div>
      </div>
    </div>
  );
};

export const prepareChartData = (historicalData: any) => {
  return {
    labels: historicalData.labels,
    data: historicalData.prices.map((price: number) => price.toString()),
  };
};

export default ChartComponent;