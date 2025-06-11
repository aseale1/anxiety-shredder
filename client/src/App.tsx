import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp.tsx';
import Home from './pages/Home';
import AddAnxiety from './pages/AddAnxiety';
import ViewProgress from './pages/ViewProgress';
import GenerateMountain from './pages/GenerateMountain';
import CustomAnxiety from './pages/CustomAnxiety.tsx';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/home" element={<Home />} />
          <Route path="/add-anxiety" element={<AddAnxiety />} />
          <Route path="/view-progress/:anx_id" element={<ViewProgress />} />
          <Route path="/generate-mountain/:anx_id" element={<GenerateMountain />} />
          <Route path="/custom-anxiety" element={<CustomAnxiety />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;