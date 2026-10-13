import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";
import LoadingFallback from "./components/common/LoadingFallback";
import { Toaster } from "react-hot-toast";

// Lazy-loaded route components for optimized bundle splitting
const Auth = lazy(() => import("./pages/Auth/Auth"));
const LoginForm = lazy(() => import("./components/auth/LoginForm"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const User = lazy(() => import("./pages/User/User"));
const UserDetail = lazy(() => import("./pages/UserDetail/UserDetail"));
const Library = lazy(() => import("./pages/Library/Library"));
const Book = lazy(() => import("./pages/Bookings/Bookings"));
const Transaction = lazy(() => import("./pages/Transaction/Transaction"));
const DAnonymous = lazy(() => import("./pages/DAnonymous/DAnonymous"));
const DisputesPage = lazy(() => import("./pages/Dispute/Dispute"));
const Moderation = lazy(() => import("./pages/Moderation/Moderation"));
const Feedback = lazy(() => import("./pages/Feedback/Feedback"));

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

            <Route path="user">
              <Route index element={<User />} />
              <Route path=":userId" element={<UserDetail />} />
            </Route>
            <Route path="library/*" element={<Library />} />
            <Route path="bookings" element={<Book />} />
            <Route path="transaction" element={<Transaction />} />
            <Route path="danonymous" element={<DAnonymous />} />
            <Route path="/disputes/*" element={<DisputesPage />} />
            <Route path="/moderation/*" element={<Moderation />} />
            <Route path="/feedback/*" element={<Feedback />} />
          </Route>

          {/* Public Routes */}
          <Route path="/auth" element={<Auth />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<LoginForm />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;
