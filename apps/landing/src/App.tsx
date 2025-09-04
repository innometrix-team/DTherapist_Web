import './App.css'
import { Routes, Route } from "react-router-dom";
import Index from './pages/Index'
import PrivacyPolicy from './components/privacy-policy/PrivacyPolicy';
import { Analytics } from "@vercel/analytics/next"

function App() {
  

  return (
    <>
      <Analytics />
     <Routes>
     <Route path="/" element={<Index/>} />
      <Route path="/privacy-policy" element={<PrivacyPolicy/>} />
     </Routes>
      
    </>
  )
}

export default App
