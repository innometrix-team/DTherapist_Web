import './App.css'
import { Routes, Route } from "react-router-dom";
import Index from './pages/Index'
import PrivacyPolicy from './components/privacy-policy/PrivacyPolicy';

function App() {
  

  return (
    <>
     <Routes>
     <Route path="/" element={<Index/>} />
      <Route path="/privacy-policy" element={<PrivacyPolicy/>} />
     </Routes>
      
    </>
  )
}

export default App
