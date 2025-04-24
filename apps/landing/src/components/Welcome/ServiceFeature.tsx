import React from 'react';
import { WelcomeFeature } from '../../types';

const ServiceFeature: React.FC<WelcomeFeature> = ({ icon, title, description }) => {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="text-md font-semibold text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default ServiceFeature;
