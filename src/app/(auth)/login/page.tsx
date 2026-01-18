import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-600 mb-6">Log in to continue to your dashboard.</p>
        <Link href="/api/auth/login" className="btn-primary w-full inline-block text-center">
          Log In with Auth0
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 block mt-4">
          Back to home
        </Link>
      </div>
    </div>
  )
}
