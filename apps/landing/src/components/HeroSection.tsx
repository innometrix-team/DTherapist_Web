import { APP_LINKS } from "../constants/links";

const HeroSection = () => {
  return (
    <section
      className="relative min-h-[75vh] md:min-h-[82vh] flex items-center justify-center bg-cover bg-center text-white m-4 md:m-6 rounded-2xl shadow-md overflow-hidden"
      style={{
        backgroundImage:
          "url('https://ik.imagekit.io/rqi1dzw2h/homepage/home1.png?updatedAt=1746018233090')",
      }}
    >
      <div className="absolute inset-0 bg-darkerb/70 backdrop-blur-[2px] rounded-2xl"></div>
      <div className="relative z-10 text-center px-4 py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-5 tracking-tight text-white drop-shadow-xs">
          Empowering Healing, Nurturing Growth
        </h1>
        <p className="text-sm sm:text-base md:text-lg mb-8 max-w-2xl mx-auto text-white/90 leading-relaxed font-normal">
          We connect you to licensed professionals committed to helping you live your best, healthiest life with total privacy and compassion.
        </p>
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <a
            href={APP_LINKS.dashboard}
            className="bg-primary hover:bg-darkerb text-white font-semibold px-7 py-3 rounded-xl inline-flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-transparent"
          >
            Get Started
          </a>
          <a
            href={APP_LINKS.dashboard}
            className="bg-white/95 hover:bg-offwhite text-darkerb font-semibold px-7 py-3 rounded-xl inline-flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-white/30"
          >
            Consult Us
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
