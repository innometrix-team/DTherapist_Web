// src/components/ServiceCards/ServiceList.tsx
import React from 'react';
import ServiceCard from './ServiceCard';
import { services } from '../../utils/constants';

const ServiceList = () => {
  return (
    <section className="py-4 bg-gray-100 text-center">
      <div className="grid gap-8 md:grid-cols-3 px-2 max-w-6xl mx-auto">
        {services.map((service, index) => (
          <ServiceCard key={index} {...service} />
        ))}
      </div>
    </section>
  );
};

export default ServiceList;
