import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Welcome to Restaurant Week Bingo!
      </h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Explore local restaurants, collect stamps on your bingo card, and win prizes during restaurant week!
      </p>
      <div className="space-x-4">
        <Link
          href="/login"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
        >
          Get Started
        </Link>
        <Link
          href="/about"
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Learn More
        </Link>
      </div>
    </div>
  )
}
