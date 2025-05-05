function ForgotPassword() {
  return (
    <div className="max-w-md w-full mx-auto space-y-4">
      <h2 className="text-3xl font-bold">Forgot Password</h2>
      <p className="text-gray-500 text-sm">
        Enter the email address associated with your account.
      </p>
      <form className="space-y-4">
        <input
          type="email"
          placeholder="Email Address"
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
        <button className="w-fit bg-primary text-white py-2 px-4 rounded font-medium">
          Send Reset Link
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;
