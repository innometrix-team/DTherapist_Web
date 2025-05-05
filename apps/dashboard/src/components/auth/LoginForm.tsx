import { Link } from "react-router-dom";

function LoginForm() {
  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold">Login to account</h2>
      <p className="text-gray-500 text-sm">
        Lorem ipsum dolor sit amet consectetur. Mauris purus vulpuLore
      </p>
      <form className="space-y-4">
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
        <div className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <p className="text-sm">
            I agree to the{" "}
            <span className="font-semibold text-blue-700">
              Terms & Conditions
            </span>{" "}
            of Dtherapist.
          </p>
        </div>
        <button className="w-fit bg-primary text-white py-2 px-4 rounded font-medium">
          Login
        </button>
        <p className="text-sm text-gray-600 text-center">
          Don’t have an account?{" "}
          <Link to="/auth/signup" className="text-blue-700 font-semibold">
            Signup
          </Link>
        </p>
        <p className="text-sm text-center mt-2">
          Forgot Password?{" "}
          <Link
            to="/auth/forgot-password"
            className="text-blue-700 font-semibold"
          >
            Reset
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;
