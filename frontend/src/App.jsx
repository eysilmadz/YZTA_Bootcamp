import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { store } from './app/store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TechnicalInterviewScreen from './components/TechnicalInterviewScreen';
import Login from './components/Login';
import EvaluationScreen from './components/EvaluationScreen';

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem("candidate_user");
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Main Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="interview" element={<TechnicalInterviewScreen />} />
            <Route path="evaluation" element={<EvaluationScreen />} />
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
