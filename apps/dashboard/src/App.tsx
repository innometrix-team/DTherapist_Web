import './App.css'
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth"; 
import SignupForm from "./components/auth/SignupForm";
import LoginForm from "./components/auth/LoginForm";
import ForgotPassword from "./components/auth/ForgotPassword";
import EmailVerification from "./components/auth/EmailVerification";
import ChangePasswordForm from './components/auth/ChangePasswordForm';
import Settings from './pages/Settings';

function App() {
  

  return (
   
    <Routes> 
      <Route path="/settings" element={<Settings />} />
      {/* Add other routes here */}
    <Route path="/auth" element={<Auth />}>
    <Route index element={<Navigate to="login" />} />
        <Route path="signup" element={<SignupForm />} />
        <Route path="login" element={<LoginForm />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="verify-email" element={<EmailVerification />} />
        <Route path="change-password" element={<ChangePasswordForm />} />
      </Route>
  </Routes>
 
  )
}

export default App
