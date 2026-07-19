import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from './app/store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TechnicalInterviewScreen from './components/TechnicalInterviewScreen';
import EvaluationScreen from './components/EvaluationScreen';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="interview" element={<TechnicalInterviewScreen />} />
            <Route path="evaluation" element={<EvaluationScreen />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
