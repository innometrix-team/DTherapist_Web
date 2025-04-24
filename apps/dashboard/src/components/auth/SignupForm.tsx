import { Link } from "react-router-dom";

function SignUpForm() {
    return (
      <div className="max-w-md w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold">Create free account</h2>
      <p className="text-gray-500 text-sm">
        Lorem ipsum dolor sit amet consectetur. Mauris purus vulpuLore
      </p>
      <form className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <input
          type="email"
          placeholder="Email Address"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <select className="w-full border border-gray-300 rounded px-4 py-2">
          <option value="">Register as</option>
          <option value="client">Client</option>
          <option value="therapist">Therapist</option>
        </select>

        <div className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <p className="text-sm">
            I agree to the <span className="font-semibold text-blue-700">Terms & Conditions</span> of Dtherapist.
          </p>
        </div>
        <button className="w-fit bg-Dblue text-white py-2 px-4 rounded font-medium">Create Account</button>
        <p className="text-sm text-gray-600 text-center">
          I already have an account? <Link to="/auth/login" className="text-blue-700 font-semibold">Login</Link>
        </p>
      </form>
    </div>
    );
}

export default SignUpForm;