// src/components/AboutSection.tsx
import React from "react";
import { AboutSectionProps } from "../types";

const AboutSection: React.FC<AboutSectionProps> = ({
  imageUrl,
  subtitle,
  title,
  description,
  buttonText = true,
  showDownloadButtons = false,
  iosUrl,
  androidUrl,
}) => {
  return (
    <section className="py-16 px-6 md:px-24 bg-white">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className=" p-2 rounded-2xl shadow-lg">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-[300px] md:h-[500px] rounded-2xl  object-contain "
          />
        </div>
        <div>
          <h5 className="text-primary font-bold">{subtitle}</h5>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">
            {title}
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed text-sm md:text-base">
            {description}
          </p>
          {buttonText && (
            <button className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-700 transition-all">
              Learn More
            </button>
          )}

          {/* Optional Download Buttons */}
          {showDownloadButtons && (
            <div className="flex gap-4 mt-6">
              {iosUrl && (
                <a href={iosUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://ik.imagekit.io/rqi1dzw2h/homepage/applestore.png?updatedAt=1746020196053"
                    alt="Download on the App Store"
                    className="h-12"
                  />
                </a>
              )}
              {androidUrl && (
                <a href={androidUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://ik.imagekit.io/rqi1dzw2h/homepage/playstore.png?updatedAt=1746020196102"
                    alt="Get it on Google Play"
                    className="h-12"
                  />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
