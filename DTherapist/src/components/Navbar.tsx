import React from 'react'

function Navbar() {
  return (
    <>
     <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <div className="text-xl font-bold text-Dblue">DTherapist</div>
      <ul className="hidden md:flex gap-6 text-sm font-medium">
        <li><a href="#" className="hover:text-Dblue">Home</a></li>
        <li><a href="#" className="hover:text-Dblue">Therapists</a></li>
        <li><a href="#" className="hover:text-Dblue">Reviews</a></li>
        <li><a href="#" className="hover:text-Dblue">FAQs</a></li>
      </ul>
      <div className="flex gap-4">
        <button className="text-sm border border-Dblue text-Dblue px-4 py-1 rounded hover:bg-Dblue hover:text-white">Login</button>
        <button className="text-sm bg-Dblue text-white px-4 py-1 rounded hover:bg-Dblue">Register</button>
      </div>
    </nav>
    </>
  )
}

export default Navbar