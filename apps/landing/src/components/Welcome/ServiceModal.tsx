// components/ServiceModal.tsx
import React from 'react';
import { X } from 'lucide-react';
import { serviceDetails } from '../../utils/constants';
import { ServiceModalProps } from '../../types';
import { Link } from 'react-router-dom';


const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, service }) => {
  if (!isOpen || !service) return null;

  const details = serviceDetails[service.title];

  if (!details) {
    console.warn(`Service details not found for: ${service.title}`);
    return null;
  }
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center h-ful">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm "
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto mx-4 w-full">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-full p-3">
                {service.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{service.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Overview */}
          <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Overview</h3>
            <p className="text-gray-600 leading-relaxed">{details.overview}</p>
          </section>

          {/* What We Offer */}
          <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">What We Offer</h3>
            <ul className="space-y-2">
              {details.whatWeOffer?.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Why Choose Us */}
          <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">How It Works</h3>
            <ul className="space-y-2">
              {details.HowItWorks?.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Who Can Benefit */}
          <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Who Can Benefit</h3>
            <ul className="space-y-2">
              {details.whoCanBenefit?.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Therapeutic Approaches */}
          <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Therapeutic Approaches</h3>
            <ul className="space-y-2">
              {details.approaches?.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Call to Action */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready to Get Started?</h3>
            <p className="text-gray-600 mb-4">
              Take the first step towards better mental health. Our qualified therapists are here to support you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              
                  <Link to="https://dashboard.dtherapist.com/" className="bg-primary hover:bg-blue-800 text-white px-6 py-2 rounded-lg transition-colors">

                Book a Session
                </Link>

                  
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;