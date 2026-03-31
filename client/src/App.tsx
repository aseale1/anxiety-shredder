import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AddAnxiety from './pages/AddAnxiety';
import GenerateMountain from './pages/GenerateMountain';
import CustomAnxiety from './pages/CustomAnxiety.tsx';

const App = () => {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<AddAnxiety />} />
          <Route path="/generate-mountain/:anx_id" element={<GenerateMountain />} />
          <Route path="/custom-anxiety" element={<CustomAnxiety />} />
        </Routes>
      </Router>
  );
};

export default App;