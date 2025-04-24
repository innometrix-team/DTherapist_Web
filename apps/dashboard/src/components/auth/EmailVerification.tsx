

function EmailVerification() {
  return (
    <div className="max-w-md w-full mx-auto space-y-4 text-center">
    <h2 className="text-3xl font-bold">Check Your Email</h2>
    <p className="text-gray-500 text-sm">
      We’ve sent a verification link to your email. Please check your inbox and click the link to verify your account.
    </p>
    <button className="bg-Dblue text-white py-2 px-4 rounded font-medium">
      Resend Verification Email
    </button>
  </div>
  )
}

export default EmailVerification