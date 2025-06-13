import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import DAnonymousChat from "./components/anonymous/DAnonymousChat";
import ChangePasswordForm from "./components/auth/ChangePasswordForm";
import EmailVerification from "./components/auth/EmailVerification";
import ForgotPassword from "./components/auth/ForgotPassword";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";
import Layout from "./components/layout/Layout";
import Appointments from "./pages/appointments/Appointments";
import Auth from "./pages/Auth";
import Counselor from "./pages/counselor/Counselor";
import DAnonymous from "./pages/danonymous/DAnonymous";
import Dashboard from "./pages/dashboard/Dashboard";
import Library from "./pages/library/Library";
import MySchedule from "./pages/my-schedule/MySchedule";
import ClientDetail from "./components/appointment/ClientDetail";
import DAnonymous from "./pages/danonymous/DAnonymous";
import PrivacyPolicy from "./pages/privacy-policy/PrivacyPolicy";

import Settings from "./pages/settings/Settings";
import { Toaster } from "react-hot-toast";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="counselor" element={<Counselor />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/client-details/:clientId" element={<ClientDetail/>}/>
        <Route path="library" element={<Library />} />
        <Route path="settings" element={<Settings />} />
        <Route path="my-schedule" element={<MySchedule />} />
        <Route path="anonymous" element={<DAnonymous />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
      </Route>
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="counselor" element={<Counselor />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="library" element={<Library />} />
          <Route path="settings" element={<Settings />} />
          <Route path="my-schedule" element={<MySchedule />} />
          <Route path="anonymous" element={<DAnonymous />}>
            <Route index />
            <Route path=":groupId" element={<DAnonymousChat />} />
          </Route>
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
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;