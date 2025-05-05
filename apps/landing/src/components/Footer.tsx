
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
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:underline">Home</a></li>
            <li><a href="#" className="hover:underline">About</a></li>
            <li><a href="#" className="hover:underline">Therapists</a></li>
            <li><a href="#" className="hover:underline">Features</a></li>
            <li><a href="#" className="hover:underline">FAQs</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
          <p className="text-sm mb-2">Email: support@dtherapist.com</p>
          <p className="text-sm mb-2">Phone: +234 800 000 0000</p>
          <p className="text-sm">Location: Abuja, Nigeria</p>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Download Our App</h4>

          <div className="flex gap-3">
            <a href="#">
              <img src='https://ik.imagekit.io/rqi1dzw2h/homepage/applestore.png?updatedAt=1746020196053' alt="Download on iOS" className="w-28" />
            </a>
            <a href="#">
              <img src='https://ik.imagekit.io/rqi1dzw2h/homepage/playstore.png?updatedAt=1746020196102' alt="Download on Android" className="w-28" />
            </a>
          </div>
        </div>

        
      </div>

      <div className="text-center mt-10 text-sm text-gray-300">
        &copy; {new Date().getFullYear()} DTherapist. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
