import React, { useState } from 'react';
import {faqs} from '../utils/constants';


const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-gray-50 py-16 px-6 md:px-16">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Image section */}
        <div>
          <img
            src="https://ik.imagekit.io/rqi1dzw2h/homepage/faq1.png?updatedAt=1746018181149"
            alt="FAQ Illustration"
            className="w-full h-[300px] md:h-[500px] rounded-xl shadow-md object-cover"
          />
        </div>

        {/* FAQ content section */}
        <div>
          <h5 className="text-sm text-Dblue font-bold mb-2">FAQs</h5>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 mb-6 text-sm md:text-base">
            Have questions? We’ve got answers. Here’s everything you need to know about using DTherapist.
          </p>
          <div>
            {faqs.map(({ question, answer }, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-4 mb-4 cursor-pointer"
                onClick={() => toggleFAQ(index)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-base md:text-lg text-gray-800">{question}</h4>
                  <span className="text-Dblue text-xl">{openIndex === index ? '-' : '+'}</span>
                </div>
                {openIndex === index && (
                  <p className="text-sm text-gray-600 mt-2">{answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
