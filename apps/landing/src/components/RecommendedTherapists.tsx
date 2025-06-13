import React from "react";
import { FaStar, FaUserCircle } from "react-icons/fa";
import { therapists } from "../utils/constants";

const RecommendedTherapists: React.FC = () => {
  return (
    <section className="bg-gray-50 py-16 px-10 md:px-16">
      <div className="text-center mb-12">
        <h5 className="text-sm text-primary font-bold">Recommended</h5>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
          Meet Our Therapists
        </h2>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        {therapists.map(
          ({
            id,
            name,
            specialty,
            reviews,
            stars,
            experience,
            rate,
            image,
          }) => (
            <div
              key={id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-all flex w-full max-w-[500px] mx-auto"
            >
              <img
                src={image}
                alt={name}
                className="w-36 sm:w-40 h-auto object-cover rounded-l-xl"
              />

              <div className="p-3 flex-1">
                <h3 className="text-base font-bold text-gray-800 mb-1">
                  {name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{specialty}</p>
                <div className="flex items-center text-yellow-500 text-xs mb-1">
                  {[...Array(Math.round(stars))].map((_, i) => (
                    <FaStar key={i} className="mr-1" />
                  ))}
                  <span className="text-gray-600 ml-2">
                    ({reviews} reviews)
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  Experience: {experience} years
                </p>
                <p className="text-xs text-gray-600 mb-2">Rate: {rate}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button className="bg-primary text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition-all">
                    Book Now
                  </button>
                  <FaUserCircle
                    className="text-lg text-gray-600 cursor-pointer hover:text-primary"
                    title="View Profile"
                  />
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
};

export default RecommendedTherapists;
