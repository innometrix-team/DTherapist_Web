import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import SignupForm from "./components/auth/SignupForm";
import LoginForm from "./components/auth/LoginForm";
import ForgotPassword from "./components/auth/ForgotPassword";
import EmailVerification from "./components/auth/EmailVerification";
import ChangePasswordForm from "./components/auth/ChangePasswordForm";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import Counselor from "./pages/counselor/Counselor";
import Appointments from "./pages/appointments/Appointments";
import Library from "./pages/library/Library";
import Settings from "./pages/settings/Settings";
import MySchedule from "./pages/my-schedule/MySchedule";
import ClientDetail from "./components/appointment/ClientDetail";
import DAnonymous from "./pages/danonymous/DAnonymous";
import PrivacyPolicy from "./pages/privacy-policy/PrivacyPolicy";
// No need to import ScheduleSession as it's now a modal

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="counselor" element={<Counselor />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/client-details" element={<ClientDetail/>}/>
        <Route path="library" element={<Library />} />
        <Route path="settings" element={<Settings />} />
        <Route path="my-schedule" element={<MySchedule />} />
        <Route path="anonymous" element={<DAnonymous />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
      </Route>

      <Route path="auth" element={<Auth />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="signup" element={<SignupForm />} />
        <Route path="login" element={<LoginForm />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="verify-email" element={<EmailVerification />} />
        <Route path="change-password" element={<ChangePasswordForm />} />
      </Route>
    </Routes>
  );
}

export default App;