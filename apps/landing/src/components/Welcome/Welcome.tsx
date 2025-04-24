import React from 'react';
import ServiceFeature from './ServiceFeature';
import { welcomeFeatures } from '../../utils/constants';
import { WelcomeFeature } from '../../types';

const Welcome = () => {
  return (
    <section className="py-12 px-4 sm:px-8 md:px-16 bg-gray-50">
      {/* Header */}
      <div className="text-center mb-10">
        <h5 className="text-sm font-bold text-Dblue uppercase">Welcome to DTherapist</h5>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-black max-w-2xl mx-auto mt-2">
          Caring Today For A Healthier Tomorrow And Forever
        </h1>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left - Features */}
        <div className="space-y-6">
          {welcomeFeatures.map((feature: WelcomeFeature, idx: number) => (
            <ServiceFeature
              key={idx}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        {/* Right - Image */}
        <div>
          <img
            src="https://res.cloudinary.com/dqfzpmiiw/image/upload/v1744094284/img1_pxdd9l.jpg"
            alt="Therapist welcome"
            className="w-full h-full object-cover rounded-2xl shadow-md max-h-[500px]"
          />
        </div>
      </div>
    </section>
  );
};

export default Welcome;
