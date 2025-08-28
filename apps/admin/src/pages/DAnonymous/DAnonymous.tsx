import React, { useState } from "react";
import { Users, Plus, Grid3X3, Settings } from "lucide-react";
import DAnonymousGroupsList from "../../components/DAnonymous/DAnonymousGroupsList";
import CreateDAnonymousGroup from "../../components/DAnonymous/CreateDAnonymousGroup";
import { useAuthStore } from "../../Store/auth/useAuthStore";

type ViewMode = 'list' | 'create';

const DAnonymous: React.FC = () => {
  const { role } = useAuthStore();
  const [currentView, setCurrentView] = useState<ViewMode>('list');

  // Check if user is admin
  const isAdmin = role === "admin";

  // Handle view changes
  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
  };

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Banner */}
        <div 
          className="h-48 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 relative overflow-hidden"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23a855f7;stop-opacity:1" /><stop offset="50%" style="stop-color:%23ec4899;stop-opacity:1" /><stop offset="100%" style="stop-color:%23ef4444;stop-opacity:1" /></linearGradient></defs><rect width="1200" height="300" fill="url(%23grad)"/></svg>')`,
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10 flex flex-col justify-center h-full px-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white text-4xl font-bold">DAnonymous</h1>
                <p className="text-white/90 text-lg">Support Groups Management</p>
              </div>
            </div>
            <p className="text-white/80 text-sm max-w-2xl">
              Create and manage anonymous support groups to help people connect and find the support they need.
            </p>
          </div>
        </div>

        {/* Access Denied Content */}
        <div className="p-6 -mt-12 relative z-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">
                Administrator access is required to manage support groups.
              </p>
              <p className="text-sm text-gray-500">
                Please contact your system administrator if you need access to this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div 
        className="h-48 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 relative overflow-hidden"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23a855f7;stop-opacity:1" /><stop offset="50%" style="stop-color:%23ec4899;stop-opacity:1" /><stop offset="100%" style="stop-color:%23ef4444;stop-opacity:1" /></linearGradient></defs><rect width="1200" height="300" fill="url(%23grad)"/></svg>')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col justify-center h-full px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-4xl font-bold">DAnonymous</h1>
              <p className="text-white/90 text-lg">Support Groups Management</p>
            </div>
          </div>
          <p className="text-white/80 text-sm max-w-2xl">
            Create and manage anonymous support groups to help people connect and find the support they need.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="p-6 -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="flex">
              <button
                onClick={() => handleViewChange('list')}
                className={`flex items-center gap-3 px-6 py-4 font-medium transition-colors relative ${
                  currentView === 'list'
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
                <span>Groups Overview</span>
                {currentView === 'list' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              
              <button
                onClick={() => handleViewChange('create')}
                className={`flex items-center gap-3 px-6 py-4 font-medium transition-colors relative ${
                  currentView === 'create'
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Create Group</span>
                {currentView === 'create' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <span>DAnonymous</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">
                {currentView === 'list' ? 'Groups Overview' : 'Create Group'}
              </span>
            </nav>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {currentView === 'list' && (
              <div>
                {/* Quick Stats Header */}
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Support Groups</h2>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Active Groups</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Community Support</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DAnonymousGroupsList />
              </div>
            )}
            
            {currentView === 'create' && (
              <div>
                {/* Create Header */}
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Create New Support Group</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Plus className="w-4 h-4" />
                      <span>New Group Setup</span>
                    </div>
                  </div>
                </div>
                
                {/* Custom Create Component Container */}
                <div className="bg-gray-50">
                  <CreateDAnonymousGroup />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">About DAnonymous Groups</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  DAnonymous provides a safe, anonymous platform for people to connect with others facing similar challenges. 
                  Groups are moderated and focus on peer support, sharing experiences, and building community around mental health, 
                  addiction recovery, trauma healing, and other life challenges.
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-blue-600">
                  <span className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Anonymous participation
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Peer-to-peer support
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Professional moderation
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                    Safe space guidelines
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DAnonymous;