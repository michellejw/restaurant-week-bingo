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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">How to Play Restaurant Week Bingo</h1>
        </div>
        
        <div className="space-y-6">
          <section className="card p-6 border-l-4 border-[#ff5436]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Getting Started</h2>
            <p className="text-gray-600 mb-4">
              Welcome to Pleasure Island Restaurant Week Bingo! Fill out your card to be entered in a raffle: every 3 restaurants you visit earns you a raffle entry.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 ml-4">
              <li>Sign up or log in to your account</li>
              <li>Get your unique digital bingo card filled with participating restaurants</li>
              <li>Visit restaurants during Restaurant Week</li>
              <li>Check in at each location you visit</li>
            </ol>
          </section>

          <section className="card p-6 border-l-4 border-[#ff5436]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Checking In</h2>
            <div className="space-y-4 text-gray-600">
              <p>When you visit a restaurant:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Click the "Check In" button at the top of your screen</li>
                <li>Find the Restaurant's special bingo poster</li>
                <li>Scan the QR code or fill in the code manually</li>
                <li>Your visit will be recorded and your bingo card updated</li>
              </ol>
              <p className="mt-4 p-3 bg-[#ff5436]/5 rounded-lg border border-[#ff5436]/10">
                You can track your progress through the interactive map and your digital bingo card.
                Watch as your card fills up and your raffle entries increase!
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
