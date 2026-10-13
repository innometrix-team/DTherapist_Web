import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import LoadingFallback from "./components/common/LoadingFallback";
import { Toaster } from "react-hot-toast";

// Lazy-loaded route components for optimized bundle splitting
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Counselor = lazy(() => import("./pages/counselor/Counselor"));
const Appointments = lazy(() => import("./pages/appointments/Appointments"));
const ClientDetail = lazy(() => import("./components/appointment/ClientDetail"));
const Library = lazy(() => import("./pages/library/Library"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const MySchedule = lazy(() => import("./pages/my-schedule/MySchedule"));
const DAnonymous = lazy(() => import("./pages/danonymous/DAnonymous"));
const DAnonymousChat = lazy(() => import("./components/anonymous/DAnonymousChat"));
const PrivacyPolicy = lazy(() => import("./pages/privacy-policy/PrivacyPolicy"));
const ChatWrapper = lazy(() => import("./pages/ChatWrapper/ChatWrapper"));
const DisputePage = lazy(() => import("./components/appointment/Dispute"));
const VideoCallPage = lazy(() => import("./pages/video-call/VideoCall"));
const TermsAndConditions = lazy(() => import("./pages/terms-and-conditions/TermsAndConditions"));
const Auth = lazy(() => import("./pages/Auth"));
const SignupForm = lazy(() => import("./components/auth/SignupForm"));
const LoginForm = lazy(() => import("./components/auth/LoginForm"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword"));
const EmailVerification = lazy(() => import("./components/auth/EmailVerification"));
const ChangePasswordForm = lazy(() => import("./components/auth/ChangePasswordForm"));

function App() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;
