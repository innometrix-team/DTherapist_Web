import React, { useState } from 'react';
import { ChevronDown, Users, UserCheck, Shield, Scale, AlertCircle } from 'lucide-react';
import { COUNSELOR_TERMS, CLIENT_TERMS, GENERAL_TERMS, TermsData } from './constant';

interface TermsAndConditionsProps {
  className?: string;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'counselor' | 'client'>('counselor');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['eligibility', 'client-eligibility', 'service', 'booking'])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = currentTerms.sections.map((s) => s.id);
    setExpandedSections(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const currentTerms: TermsData = activeTab === 'counselor' ? COUNSELOR_TERMS : CLIENT_TERMS;

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Switcher & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Segmented Control */}
        <div className="inline-flex p-1.5 bg-gray-100 rounded-xl border border-divider/60 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('counselor');
              setExpandedSections(new Set(['eligibility', 'service']));
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'counselor'
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-darkerb'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>For Professionals</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('client');
              setExpandedSections(new Set(['client-eligibility', 'booking']));
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'client'
                ? 'bg-primary text-white shadow-xs'
                : 'text-gray-600 hover:text-darkerb'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>For Clients</span>
          </button>
        </div>

        {/* Expand / Collapse All */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 hover:text-primary transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 hover:text-primary transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Main Terms Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="px-6 sm:px-8 py-5 bg-darkerb text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 block mb-1">
              {activeTab === 'counselor' ? 'Professional Agreement' : 'Member Agreement'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{currentTerms.title}</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-white/90 border border-white/10">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Legally Binding</span>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="p-6 sm:p-8 space-y-4">
          {currentTerms.sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);

            return (
              <div
                key={section.id}
                className="border border-gray-200/90 rounded-xl overflow-hidden transition-all duration-150 hover:border-primary/40 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isExpanded}
                  className="w-full px-5 py-4 text-left bg-gray-50/60 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-darkerb truncate">
                      {section.title}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-6 py-5 bg-white border-t border-gray-100">
                    <ul className="space-y-3">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          {/* Legal Governance & Arbitration Notice */}
          <div className="mt-8 p-6 bg-offwhite rounded-xl border border-divider/80 space-y-4">
            <div className="flex items-center gap-2.5 text-darkerb font-bold text-base">
              <Scale className="w-5 h-5 text-primary" />
              <span>Governing Law & Legal Disclaimers</span>
            </div>
            <div className="space-y-2.5 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <p>
                <strong className="text-darkerb">Governing Law:</strong> {GENERAL_TERMS.governingLaw}
              </p>
              <p className="p-3 bg-white rounded-lg border border-gray-200/70 text-gray-700">
                {GENERAL_TERMS.clientNote}
              </p>
              <p className="p-3 bg-white rounded-lg border border-gray-200/70 text-gray-700">
                {GENERAL_TERMS.counselorNote}
              </p>
              <p className="p-3 bg-white rounded-lg border border-gray-200/70 text-gray-700">
                {GENERAL_TERMS.arbitration}
              </p>
              <p className="text-xs text-gray-500 pt-1">
                {GENERAL_TERMS.exceptions}
              </p>
            </div>
          </div>

          {/* Acknowledgment Card */}
          <div className="mt-6 p-5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3.5">
            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
              By {activeTab === 'counselor' ? 'registering as a professional on DTherapist' : 'booking an appointment or using DTherapist'},
              you acknowledge that you have read, understood, and agree to be bound by these terms, as well as our platform safety and privacy guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;