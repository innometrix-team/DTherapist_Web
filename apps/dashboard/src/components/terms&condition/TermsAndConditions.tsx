import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Users, UserCheck, Shield } from 'lucide-react';
import { COUNSELOR_TERMS, CLIENT_TERMS, GENERAL_TERMS, TermsData } from './constant';

interface TermsAndConditionsProps {
  className?: string;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'counselor' | 'client'>('counselor');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const currentTerms: TermsData = activeTab === 'counselor' ? COUNSELOR_TERMS : CLIENT_TERMS;

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex justify-center">
          <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('counselor')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'counselor'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:text-primary hover:bg-blue-50'
              }`}
            >
              <Users className="inline-block w-5 h-5 mr-2" />
              For Counselors
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'client'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:text-primary hover:bg-purple-50'
              }`}
            >
              <UserCheck className="inline-block w-5 h-5 mr-2" />
              For Clients
            </button>
          </div>
        </div>
      </div>

      {/* Terms Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className={`px-8 py-6 ${activeTab === 'counselor' ? 'bg-primary' : 'bg-primary'} text-white`}>
          <h2 className="text-2xl font-bold">{currentTerms.title}</h2>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            {currentTerms.sections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSections.has(section.id);

              return (
                <div
                  key={section.id}
                  className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Icon className={`w-6 h-6 mr-3 ${activeTab === 'counselor' ? 'text-primary' : 'text-primary'}`} />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {section.title}
                      </h3>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 py-4 bg-white">
                      <ul className="space-y-3">
                        {section.content.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                              activeTab === 'counselor' ? 'bg-primary' : 'bg-primary'
                            }`} />
                            <span className="text-gray-700 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Additional Information */}
          <div className="mt-12 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Important Information
            </h3>
            <div className="space-y-3 text-gray-700">
              <p className="leading-relaxed">
                <strong>Governing Law:</strong> {GENERAL_TERMS.governingLaw}
              </p>
              <p className="leading-relaxed font-medium text-blue-800">
                {GENERAL_TERMS.note}
              </p>
              <p className="text-sm text-gray-600 mt-4">
                {GENERAL_TERMS.exceptions}
              </p>
            </div>
          </div>

          {/* Agreement Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <p className="text-green-800 font-medium text-center">
              By {activeTab === 'counselor' ? 'registering on DTherapist' : 'booking an appointment with DTherapist'}, 
              you acknowledge that you have read, understood, and agree to these terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;