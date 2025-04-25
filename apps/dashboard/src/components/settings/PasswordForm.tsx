// /components/Settings/PasswordForm.tsx
import React, { useState } from "react";
import { PasswordDetails } from "../../types/settings.types";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordForm: React.FC = () => {
  const [form, setForm] = useState<PasswordDetails>({
    newPassword: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Submitting Password Change:", form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>

      <div className="flex items-center  gap-4">
        <label htmlFor="newPassword" className="text-sm font-medium text-gray-700 w-40 shrink-0">
          New Password
        </label>
        <div className="relative flex-1 max-w-md">
          <input
            id="newPassword"
            name="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={form.newPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none"
          />
          <span
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
      </div>

      <div className="flex items-center  gap-4">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 w-40 shrink-0">
          Confirm Password
        </label>
        <div className="relative flex-1 max-w-md">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none"
          />
          <span
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="bg-Dblue hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded"
        >
          Update
        </button>
      </div>
    </form>
  );
};

export default PasswordForm;
