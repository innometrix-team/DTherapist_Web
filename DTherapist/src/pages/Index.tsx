import React from 'react'
import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import ServiceList from '../components/ServiceCards/ServiceList'
import AboutSection from '../components/AboutSection'

function Index() {
  return (
    <>
    <Navbar/>
    <HeroSection/>
    <ServiceList/>
    <AboutSection/>
    </>
  )
}

export default Index