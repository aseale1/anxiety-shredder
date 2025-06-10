import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AddAnxiety from './pages/AddAnxiety';
import GenerateMountain from './pages/GenerateMountain';
import CustomAnxiety from './pages/CustomAnxiety.tsx';

/*
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp.tsx';
import Home from './pages/Home';
import Testing from './pages/Testing';
import ViewProgress from './pages/ViewProgress';
*/

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AddAnxiety />} />
          <Route path="/generate-mountain/:anx_id" element={<GenerateMountain />} />
          <Route path="/custom-anxiety" element={<CustomAnxiety />} />

        {/* Unused routes outside of demo scope
          <Route path="/" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/home" element={<Home />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/view-progress/:anx_id" element={<ViewProgress />} />

        */}

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;