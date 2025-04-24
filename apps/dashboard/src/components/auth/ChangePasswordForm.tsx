import { Link } from "react-router-dom";

const ChangePasswordForm = () => {
  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold">Change Password</h2>
      <p className="text-gray-500 text-sm">
        Update your account password to keep your account secure.
      </p>
      <form className="space-y-4">
        <input
          type="password"
          placeholder="Current Password"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <input
          type="password"
          placeholder="New Password"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <button className="w-fit bg-Dblue text-white py-2 px-4 rounded font-medium">
          Change Password
        </button>
      </form>

      <p className="text-sm text-center mt-4">
        <Link to="/auth/login" className="text-blue-700 font-semibold">
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ChangePasswordForm;
