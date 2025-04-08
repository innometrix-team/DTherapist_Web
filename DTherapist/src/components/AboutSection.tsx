import React from 'react'

function AboutSection() {
  return (
    <section className="py-16 px-24 bg-white">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Image */}
        <div>
          <img
            src="https://res.cloudinary.com/dqfzpmiiw/image/upload/v1744099145/about_image_xrkgm4.jpg"
            alt="About DTherapist"
            className="w-full h-auto rounded-2xl shadow-lg object-cover"
          />
        </div>

        {/* Text */}
        <div >
            <h5 className='text-Dblue bold'>About us</h5>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">
          Committed to Health, Committed to You.
            </h2>
          <p className="text-gray-600 mb-6 leading-relaxed text-sm md:text-base">
            At DTherapist, we believe that mental health is just as important as physical health.
            That’s why we’ve created a platform to make therapy accessible, affordable, and stigma-free.
            Whether you need a professional to talk to or you're just starting your healing journey, we're here for you.
          </p>
          <button className="bg-Dblue text-white px-6 py-2 rounded hover:bg-blue-700 transition-all">
            Learn More
          </button>
        </div>
      </div>
    </section>
  )
}

export default AboutSection