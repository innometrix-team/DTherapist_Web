// /components/Settings/Settings.tsx
import React, { useState } from "react";
import ProfileForm from "../components/settings/ProfileForm";
import CredentialForm from "../components/settings/CredentialForm";
import PasswordForm from "../components/settings/PasswordForm";
import BankDetailsForm from "../components/settings/BankDetailsForm";

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const renderForm = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileForm />;
      case "credentials":
        return <CredentialForm />;
      case "password":
        return <PasswordForm />;
      case "bank":
        return <BankDetailsForm />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full  mx-auto p-6 md:p-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Settings</h1>

      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`mr-8 pb-2 text-sm font-medium ${
            activeTab === "profile" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          className={`mr-8 pb-2 text-sm font-medium ${
            activeTab === "credentials" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("credentials")}
        >
          Credentials
        </button>
        <button
          className={`mr-8 pb-2 text-sm font-medium ${
            activeTab === "password" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("password")}
        >
          Password
        </button>
        <button
          className={`pb-2 text-sm font-medium ${
            activeTab === "bank" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
          }`}
          onClick={() => setActiveTab("bank")}
        >
          Bank Details
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {renderForm()}
      </div>
    </div>
  );
};

export default Settings;
