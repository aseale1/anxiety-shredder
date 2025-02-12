import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import Testing from './pages/Testing';
import AddAnxiety from './pages/AddAnxiety';
import ViewProgress from './pages/ViewProgress';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/home" element={<Home />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/add-anxiety" element={<AddAnxiety />} />
          <Route path="/view-progress/:anx_id" element={<ViewProgress />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
