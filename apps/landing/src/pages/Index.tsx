import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ServiceList from '../components/ServiceCards/ServiceList';
import AboutSection from '../components/AboutSection';
import Welcome from '../components/Welcome/Welcome';
import Steps from '../components/Steps';
import RecommendedTherapists from '../components/RecommendedTherapists';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

const Index: React.FC = () => {
  return (
    <>
      <Navbar />
      <div id="home">
        <HeroSection />
      </div>
      <div id="therapists">
        <RecommendedTherapists />
      </div>
      <div id="reviews">
        <Testimonials />
      </div>
      <div id="faq">
        <FAQ />
      </div>

      <ServiceList />
      <AboutSection
        imageUrl="https://res.cloudinary.com/dqfzpmiiw/image/upload/v1744094284/img1_pxdd9l.jpg"
        subtitle="About Us"
        title="Committed to Health, Committed to You."
        description="At DTherapist, we believe mental health is just as important as physical health..."
        buttonText="Learn More"
      />
      <Welcome />
      <Steps />
      <AboutSection
        imageUrl="https://res.cloudinary.com/dqfzpmiiw/image/upload/v1744094284/img1_pxdd9l.jpg"
        subtitle="DTherapist App"
        title="Get Help Anytime, Anywhere"
        description="Download our app and connect with a therapist 24/7, from anywhere in the world."
        buttonText="Explore App"
        showDownloadButtons={true}
        iosUrl="https://res.cloudinary.com/dqfzpmiiw/image/upload/v1744198275/Frame_2_uhjpxu.png"
        androidUrl="https://res.cloudinary.com/dqfzpmiiw/image/upload/v1744198275/Frame_1_lxj2uo.png"
      />
      <Footer />
    </>
  );
};

export default Index;
