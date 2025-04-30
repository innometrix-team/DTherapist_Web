const HeroSection = () => {
  return (
    <section
      className="relative h-[85vh] flex items-center justify-center bg-cover bg-center text-white m-4 rounded-2xl"
      style={{ backgroundImage: "url('https://ik.imagekit.io/rqi1dzw2h/homepage/home1.png?updatedAt=1746018233090')" }}

    >
      <div className="absolute inset-0 bg-black/70  rounded-2xl "></div>
      <div className="relative z-10 text-center px-4">
        <p className="text-xs tracking-widest uppercase mb-2">Welcome to DTherapist</p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-2xl mx-auto">
          Caring Today for a Healthier Tomorrow and Forever
        </h1>
        <p className="text-sm md:text-base mb-6 max-w-xl mx-auto">
          We connect you to the right professionals committed to helping you live your best mental health life.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-Dblue hover:bg-blue-700 text-white px-6 py-2 rounded-md">Get Started</button>
          <button className="bg-white text-black hover:bg-blue-100 px-6 py-2 rounded-md">Consult Us</button>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
