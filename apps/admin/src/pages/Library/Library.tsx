import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ArticlesList from "../../components/articles/ArticlesList";
import CreateArticle from "../../components/articles/CreateArticle";
import EditArticle from "../../components/articles/EditArticle";
import { useAuthStore } from "../../Store/auth/useAuthStore";

const LibraryPage: React.FC = () => {
  const { role } = useAuthStore();

  // Check if user is admin
  const isAdmin = role === "admin";

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            You need administrator privileges to access the library management system.
          </p>
          <p className="text-sm text-gray-500">
            Please contact your system administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Main articles list */}
        <Route path="/" element={<ArticlesList />} />
        
        {/* Create new article */}
        <Route path="/create-article" element={<CreateArticle />} />
        
        {/* Edit existing article */}
        <Route path="/edit-article/:id" element={<EditArticle />} />
        
        {/* Redirect any other paths back to main list */}
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
    </div>
  );
};

export default LibraryPage;