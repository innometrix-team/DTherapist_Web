// components/ServiceFeature.tsx
import React, { useState } from 'react';
import ServiceModal from './ServiceModal';
import { ServiceFeatureProps } from '../../types';

const ServiceFeature: React.FC<ServiceFeatureProps> = ({ icon, title, description }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleReadMore = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex items-start gap-4 mb-6">
        <div className="mt-1">{icon}</div>
        <div>
          <h4 className="text-md font-semibold text-gray-800">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
          <button 
            onClick={handleReadMore}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer focus:outline-none focus:underline"
            type="button"
          >
            read more
          </button>
        </div>
      </div>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        service={{ icon, title, description }}
      />
    </>
  );
};

export default ServiceFeature;