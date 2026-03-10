import React, { useEffect, useState } from 'react';
import './App.css';
import BubbleChart from './components/BubbleChart';
import { ChartData } from './components/types';

function App() {
  const [data, setData] = useState<ChartData | null>(null);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data.json`)
      .then(res => res.json())
      .then((json) => {
        // API returns array — take first element
        const chartData = Array.isArray(json) ? json[0] : json;
        setData(chartData);
      })
      .catch(err => console.error('Failed to load data:', err));
  }, []);

  if (!data) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a18', color: '#fff', fontSize: 14,
      }}>
        Loading chart data...
      </div>
    );
  }

  return <BubbleChart data={data} />;
}

export default App;
