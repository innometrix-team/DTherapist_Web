import { Link } from "react-router-dom";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { APP_LINKS } from "../constants/links";

const Footer = () => {
  return (
    <footer className="bg-darkerb text-white py-12 px-6 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* DTherapist Section */}
        <div>
          <h3 className="text-2xl font-bold mb-4">DTherapist</h3>
          <p className="text-sm mb-4">
            Helping you take charge of your mental health with expert support and care.
          </p>
          
        </div>

        {/* Explore Links */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-neutral/80">
            <li><Link to="/" className="hover:text-white hover:underline transition-colors">Home</Link></li>
            <li><a href="#home" className="hover:text-white hover:underline transition-colors">About</a></li>
            <li><a href="#faq" className="hover:text-white hover:underline transition-colors">FAQs</a></li>
            <li><Link to="/privacy-policy" className="hover:text-white hover:underline transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>


        {/* Contact Info */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
          <p className="text-sm mb-2">Email: support@dtherapist.com</p>
          <p className="text-sm mb-2">Phone: +234 803 308 7303</p>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
          <ul className="space-y-2 text-sm">
            <li><a href={APP_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline"> <FaFacebook /></a></li>
            <li><a href={APP_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline"> <FaInstagram /></a></li>
          </ul>
          <h4 className="text-lg font-semibold mb-4">Download Our App</h4>
          <div className="flex gap-3">
            <a href={APP_LINKS.appStore} target="_blank" rel="noopener noreferrer">
              <img src='/app-store.png' alt="Download on iOS" className="w-28" />
            </a>
            <a href={APP_LINKS.playStore} target="_blank" rel="noopener noreferrer">
              <img src='/google-play.png' alt="Download on Android" className="w-28" />
            </a>
          </div>
        </div>

        
      </div>

      <div className="text-center mt-10 text-sm text-gray-300">
        &copy; {new Date().getFullYear()} Innometrix Technology Limited. All rights reserved.
        <p>DTherapist is solely owned by Innometrix Technology Limited</p>
      </div>
    </footer>
  );
};

export default Footer;
