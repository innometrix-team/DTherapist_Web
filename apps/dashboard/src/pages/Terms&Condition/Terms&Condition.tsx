import React from 'react';
import TermsAndConditions from '../../components/terms&condition/TermsAndConditions';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              DTherapist
            </h1>
            <p className="text-lg text-gray-600">Terms and Conditions</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <TermsAndConditions />

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p className="text-sm">
            For questions or concerns, please contact DTherapist support.
          </p>
          <p className="text-xs mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;