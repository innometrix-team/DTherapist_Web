import React from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ServiceList from "../components/ServiceCards/ServiceList";
import AboutSection from "../components/AboutSection";
import Welcome from "../components/Welcome/Welcome";
import Steps from "../components/Steps";
import RecommendedTherapists from "../components/RecommendedTherapists";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";

const Index: React.FC = () => {
  return (
    <>
      <Navbar />
      <div id="home">
        <HeroSection />
      </div>
      <ServiceList />
      <AboutSection
        imageUrl="https://ik.imagekit.io/rqi1dzw2h/homepage/home6.jpg?updatedAt=1746018048918"
        subtitle="About Us"
        title="Committed to Health, Committed to You."
        description="At DTherapist, we believe in the power of technology to make mental health support more accessible than ever before. Our secure, user-friendly platform allows you to connect with highly qualified therapists from the comfort of your own space. We offer flexible scheduling, video sessions, and a range of interactive tools to enhance your therapeutic journey.
"
        buttonText={true}
      />
      <Welcome />
      <Steps />
      <AboutSection
        imageUrl="https://ik.imagekit.io/rqi1dzw2h/homepage/phone.png?updatedAt=1746018021136"
        subtitle="DTherapist App"
        title="Get Help Anytime, Anywhere"
        description="Download our app and connect with a therapist 24/7, from anywhere in the world."
        buttonText={false}
        showDownloadButtons={true}
        iosUrl="https://res.cloudinary.com/dqfzpmiiw/image/upload/v1744198275/Frame_2_uhjpxu.png"
        androidUrl="https://res.cloudinary.com/dqfzpmiiw/image/upload/v1744198275/Frame_1_lxj2uo.png"
      />

      <div id="therapists">
        <RecommendedTherapists />
      </div>
      <div id="reviews">
        <Testimonials />
      </div>
      <div id="faq">
        <FAQ />
      </div>
      <Footer />
    </>
  );
};

export default Index;
