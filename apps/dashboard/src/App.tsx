import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import DAnonymousChat from "./components/anonymous/DAnonymousChat";
import ChangePasswordForm from "./components/auth/ChangePasswordForm";
import EmailVerification from "./components/auth/EmailVerification";
import ForgotPassword from "./components/auth/ForgotPassword";
import LoginForm from "./components/auth/LoginForm";
import SignupForm from "./components/auth/SignupForm";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Appointments from "./pages/appointments/Appointments";
import Auth from "./pages/Auth";
import Counselor from "./pages/counselor/Counselor";
import Dashboard from "./pages/dashboard/Dashboard";
import Library from "./pages/library/Library";
import MySchedule from "./pages/my-schedule/MySchedule";
import ClientDetail from "./components/appointment/ClientDetail";
import DAnonymous from "./pages/danonymous/DAnonymous";
import PrivacyPolicy from "./pages/privacy-policy/PrivacyPolicy";
import Settings from "./pages/settings/Settings";
import TermsAndConditions from "./pages/Terms&Condition/Terms&Condition";
import ChatWrapper from "./pages/ChatWrapper/ChatWrapper";
import { Toaster } from "react-hot-toast";
import VideoCallPage from "./pages/video-call/VideoCall";
import DisputePage from "./components/appointment/Dispute";

function App() {
  return (
    <>
      <Routes>
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="counselor" element={<Counselor />} />
          <Route path="appointments" element={<Appointments />} />
          <Route
            path="appointments/client-details/:clientId"
            element={<ClientDetail />}
          />
          <Route path="library" element={<Library />} />
          <Route path="settings" element={<Settings />} />
          <Route path="my-schedule" element={<MySchedule />} />
          <Route path="anonymous" element={<DAnonymous />}>
            <Route index />
            <Route path=":groupId" element={<DAnonymousChat />} />
          </Route>
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="chat/:chatId" element={<ChatWrapper />} />
          <Route path="appointments/chat/:chatId" element={<ChatWrapper />} />
          <Route path="dispute/:bookingId" element={<DisputePage />} />
          <Route path="/video/:bookingId" element={<VideoCallPage />} />
        </Route>

        {/* Public Routes */}
        <Route path="terms-and-conditions" element={<TermsAndConditions />} />
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
