import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import Testing from './pages/Testing';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/home" element={<Home />} />
          <Route path="/testing" element={<Testing />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
