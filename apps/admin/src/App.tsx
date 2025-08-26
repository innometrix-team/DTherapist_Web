import { Navigate, Route, Routes } from "react-router-dom";
import './App.css'
import Auth from "./pages/Auth/Auth";
import LoginForm from "./components/auth/LoginForm";
import Dashboard from "./pages/Dashboard/Dashboard";
import Layout from "./components/layout/Layout";
import { Toaster } from "react-hot-toast";
import User from "./pages/User/User";
import Library from "./pages/Library/Library";
import Transaction from "./pages/Transaction/Transaction";

function App() {
  
  return (
    <>
      <Routes>
        {/* Protected Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* Add other protected routes here */}
          <Route path="user" element={<User />} />
          <Route path="library" element={<Library />} />
          <Route path="transaction" element={<Transaction />} />
        </Route>

        {/* Public Routes */}
        <Route path="/auth" element={<Auth />}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path="login" element={<LoginForm />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  )
}

export default App