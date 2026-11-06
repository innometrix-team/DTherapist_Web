import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProfileForm from "../../components/settings/ProfileForm";
import CredentialForm from "../../components/settings/CredentialForm";
import PasswordForm from "../../components/settings/PasswordForm";
import BankDetailsForm from "../../components/settings/BankDetailsForm";
import PageContainer from "../../components/common/PageContainer";
import { useAuthStore } from "../../store/auth/useAuthStore";

const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "profile");
  const role = useAuthStore((s) => s.role);

  // Define tabs based on user role
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: "profile", label: "Profile" },
      { id: "password", label: "Password" },
      { id: "transaction", label: "Transaction History" }
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

  // Synchronize active tab with URL query parameter (for notification deep linking)
  useEffect(() => {
    if (tabParam && tabs.some((tab) => tab.id === tabParam)) {
      setActiveTab(tabParam);
    } else if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabParam, tabs, activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const renderForm = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileForm />;
      case "credentials":
        return <CredentialForm />;
      case "password":
        return <PasswordForm />;
      case "transaction":
        return <BankDetailsForm />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageContainer className="space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-darkerb tracking-tight mb-2">Settings</h1>
        </div>

        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`mr-8 pb-3 text-sm font-semibold transition-colors shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-neutral hover:text-darkerb"
              }`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          {renderForm()}
        </div>
      </PageContainer>
    </div>
  );
};

export default Settings;