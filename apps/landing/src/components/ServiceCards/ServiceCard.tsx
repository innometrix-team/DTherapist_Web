// src/components/ServiceCards/ServiceCard.tsx
import React from 'react';
import { Service } from '../../types';

const ServiceCard: React.FC<Service> = ({ title, imageUrl, description }) => {
  return (
    <div
    className="relative rounded-xl overflow-hidden h-52 w-full max-w-[380px] group cursor-pointer transition-all duration-300 shadow-md mx-auto"
    style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
  >
    <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-300"></div>
    
    <div className="relative z-10 h-full w-full flex flex-col justify-end text-white p-4 text-left">
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  </div>
  );
};

export default ServiceCard;
