import React, { useState } from 'react';
import { Shield, Users, UserCheck, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { PRIVACY_POLICY_DATA, PrivacySection } from './constants';
import Navbar from '../Navbar';
import Footer from '../Footer';

interface CollapsibleSectionProps {
  section: PrivacySection;
  isOpen: boolean;
  onToggle: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ section, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center"
      >
        <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-primary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-primary" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-white">
          {section.content.map((paragraph, index) => (
            <p key={index} className="text-gray-700 mb-3 last:mb-0 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

const PrivacyPolicy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'providers'>('users');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['information-collection', 'data-collection-providers']));

  const toggleSection = (sectionId: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionId)) {
      newOpenSections.delete(sectionId);
    } else {
      newOpenSections.add(sectionId);
    }
    setOpenSections(newOpenSections);
  };

  const toggleAllSections = () => {
    const currentSections = activeTab === 'users' 
      ? PRIVACY_POLICY_DATA.sections.users 
      : PRIVACY_POLICY_DATA.sections.providers;
    
    const allSectionIds = currentSections.map(section => section.id);
    const allOpen = allSectionIds.every(id => openSections.has(id));
    
    if (allOpen) {
      setOpenSections(new Set());
    } else {
      setOpenSections(new Set(allSectionIds));
    }
  };

  const currentSections = activeTab === 'users' 
    ? PRIVACY_POLICY_DATA.sections.users 
    : PRIVACY_POLICY_DATA.sections.providers;

  const allSectionsOpen = currentSections.every(section => openSections.has(section.id));

  return (
    <div className="min-h-screen bg-white">

        <Navbar />
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-green-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <Shield className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              At DTherapist, we are committed to safeguarding the privacy and personal information 
              of our users as they navigate through their journey of grief and healing.
            </p>
            <div className="mt-6 flex items-center justify-center text-blue-200">
              <Calendar className="w-5 h-5 mr-2" />
              <span>Last updated: {new Date(PRIVACY_POLICY_DATA.lastUpdated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Users/Clients
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'providers'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UserCheck className="w-5 h-5 mr-2" />
            Counselors/Therapists
          </button>
        </div>

        {/* Expand/Collapse All Button */}
        <div className="mb-6">
          <button
            onClick={toggleAllSections}
            className="px-4 py-2 text-sm font-medium text-primary bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
          >
            {allSectionsOpen ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Privacy Policy Sections */}
        <div className="bg-white">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
              {activeTab === 'users' ? (
                <>
                  <Users className="w-8 h-8 mr-3 text-primary" />
                  For Users & Clients
                </>
              ) : (
                <>
                  <UserCheck className="w-8 h-8 mr-3 text-primary" />
                  For Counselors & Therapists
                </>
              )}
            </h2>
            
            {activeTab === 'providers' && (
              <div className="bg-blue-50 border-l-4 border-primary p-4 mb-6">
                <p className="text-gray-800">
                  DTherapist ("we," "us," or "our") is committed to protecting the privacy and security 
                  of our clients, including professional therapists ("Providers") and clients ("Clients"). 
                  This Privacy Policy explains how we collect, use, disclose, and protect personal information.
                </p>
              </div>
            )}

            {currentSections.map((section) => (
              <CollapsibleSection
                key={section.id}
                section={section}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>
        </div>

      </div>
        {/* Footer */}
        <Footer />
    </div>
  );
};

export default PrivacyPolicy;