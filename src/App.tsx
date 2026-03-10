import React from 'react';
import './App.css';
import BubbleChart from './components/BubbleChart';
import { SAMPLE_DATA } from './components/sampleData';

function App() {
  return <BubbleChart data={SAMPLE_DATA} />;
}

export default App;
