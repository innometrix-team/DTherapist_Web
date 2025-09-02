// src/components/HowItWorks/Steps.tsx
import React from "react";
import { steps } from "../utils/constants";

const Steps = () => {
  return (
    <section className="bg-darkerb text-white py-16 px-4 sm:px-8 md:px-16">
      <div className="max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-2 gap-10 items-center">
        {/* Left Side - Text Content */}
        <div className="text-center md:text-left">
          <p className="uppercase text-sm text-blue-200 font-semibold mb-2">
            Process
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-white text-sm md:text-base mb-6 max-w-md mx-auto md:mx-0">
            Our approach is simple and effective. Just follow the steps and get
            matched with the right mental health professional.
          </p>
          <div className="flex justify-center md:justify-start">

            <a href="https://d-therapist.vercel.app/" className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-100 hover:text-black  ml-4 transition">
              Get Started
            </a>  
          </div>
        </div>

        {/* Right Side - Steps Grid */}
        <div className="grid grid-cols-2 gap-6 w-full">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-darkerb text-white rounded-xl p-3 shadow hover:shadow-lg transition-all relative"
            >
              <div className="text-white text-3xl mb-4 flex items-center justify-center bg-gray-300 rounded-full w-12 h-12">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-white">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Steps;
