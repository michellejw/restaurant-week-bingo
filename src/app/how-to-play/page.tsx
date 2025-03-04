'use client'

import { FaUtensils } from 'react-icons/fa'

export default function HowToPlay() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-[#ff5436] p-4 rounded-lg mb-6">
            <FaUtensils className="text-3xl text-white" />
          </div>
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tight">
              <div className="mb-4">
                <span className="block text-gray-900 leading-tight">Pleasure Island</span>
                <span className="block text-gray-900">Restaurant Week</span>
              </div>
              <span className="block text-2xl">
                <span className="text-coral-600 font-bold">Top Taster</span>
                <span className="text-gray-700"> digital bingo card</span>
              </span>
            </h1>
          </div>
        </div>
        
        <div className="space-y-6">
          <section className="card p-6 border-l-4 border-[#ff5436]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Get Started</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>Sign up or log in to your account <span className="text-gray-500">(your email will only be used to notify you as a winner!)</span></li>
              <li>Check out your unique bingo card and plot your exploration!</li>
              <li>Visit as many venues as you can during Restaurant Week</li>
              <li>Check in at each location you visit - <span className="italic">Every 4 check-ins = (1) entry for the &lsquo;Top Taster&rsquo; $500 prize package!</span></li>
            </ol>
          </section>

          <section className="card p-6 border-l-4 border-[#ff5436]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Checking In</h2>
            <p className="text-gray-600 mb-4">When you visit a venue:</p>
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>Click the &ldquo;Check In&rdquo; button at the top of your screen</li>
              <li>Ask for the Bingo QR code</li>
              <li>Scan the QR code or fill in the code manually</li>
              <li>Your visit will be recorded and your bingo card updated for each visit</li>
            </ol>
            <p className="mt-6 p-3 bg-[#ff5436]/5 rounded-lg border border-[#ff5436]/10 text-gray-600">
              You can track your progress and plot your exploration through the interactive map and using your digital bingo card. Watch as your card fills up and your raffle entries increase!
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
