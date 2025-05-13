import React, { useState, useMemo } from "react";
import ProfileForm from "../../components/settings/ProfileForm";
import CredentialForm from "../../components/settings/CredentialForm";
import PasswordForm from "../../components/settings/PasswordForm";
import BankDetailsForm from "../../components/settings/BankDetailsForm";
import { useAuthStore } from "../../store/auth/useAuthStore";

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { role } = useAuthStore();

  // Define tabs based on user role
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: "profile", label: "Profile" },
      { id: "password", label: "Password" },
      { id: "bank", label: "Bank Details" }
    ];
    
    // Only counselors see credentials tab
    if (role === "counselor") {
      return [
        ...baseTabs.slice(0, 1),
        { id: "credentials", label: "Credentials" },
        ...baseTabs.slice(1)
      ];
    }
    
    return baseTabs;
  }, [role]);

  // Set initial active tab when tabs change
  React.useEffect(() => {
    if (tabs.length > 0 && !tabs.some(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

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
    <div className="w-full mx-auto p-6 md:p-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Settings</h1>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`mr-8 pb-2 text-sm font-medium ${
              activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {renderForm()}
      </div>
    </div>
  );
};

export default Settings;