import React from 'react';
import { FaStar } from 'react-icons/fa';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { testimonialData } from '../utils/constants';
import { Testimonial } from '../types/index';

interface TestimonialsProps {
  testimonials?: Testimonial[];
}

const Testimonials: React.FC<TestimonialsProps> = ({ testimonials = testimonialData }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <section className="bg-darkerb py-16 px-6 md:px-20">
      <div className="text-left mb-12">
        <h5 className="text-sm text-white font-bold">Testimonials</h5>
        <h2 className="text-3xl md:text-4xl font-bold text-white">Reviews From Our Community</h2>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {testimonials.map(({ name, title, date, feedback, image, stars }, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl p-6 shadow hover:shadow-md transition-all"
          >
            <div className="flex items-center text-yellow-500 mb-2">
              {[...Array(stars)].map((_, i) => (
                <FaStar key={i} className="text-sm" />
              ))}
            </div>
            <p className="text-xs text-gray-500 mb-1">{date}</p>
            <h4 className="font-bold text-lg text-gray-800 mb-2">{title}</h4>
            <p className="text-sm text-gray-600 mb-4">{feedback}</p>
            <div className="flex items-center gap-3">
              <img
                src={image}
                alt={name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <p className="text-sm font-semibold text-gray-700">{name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Carousel */}
      <div className="md:hidden max-w-md mx-auto">
        <Slider {...settings}>
          {testimonials.map(({ name, title, date, feedback, image, stars }, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6 shadow mx-2">
              <div className="flex items-center text-yellow-500 mb-2">
                {[...Array(stars)].map((_, i) => (
                  <FaStar key={i} className="text-sm" />
                ))}
              </div>
              <p className="text-xs text-gray-500 mb-1">{date}</p>
              <h4 className="font-bold text-lg text-gray-800 mb-2">{title}</h4>
              <p className="text-sm text-gray-600 mb-4">{feedback}</p>
              <div className="flex items-center gap-3">
                <img
                  src={image}
                  alt={name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <p className="text-sm font-semibold text-gray-700">{name}</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Testimonials;
