/**
 * RESTAURANT WEEK CONFIGURATION
 * 
 * 🍽️ UPDATE THIS FILE FOR EACH RESTAURANT WEEK EVENT 🍽️
 * 
 * This file controls when users can start checking in to restaurants.
 * Simply update the date below for each new Restaurant Week period.
 */

export const RESTAURANT_WEEK_CONFIG = {
  /**
   * 📅 RESTAURANT WEEK START DATE
   * 
   * Format: 'YYYY-MM-DD'
   * 
   * Just change this date for each Restaurant Week:
   * - Current: October 11, 2025 → '2025-10-11'
   * - Next could be: April 15, 2026 → '2026-04-15'  
   * - Following: October 10, 2026 → '2026-10-10'
   * 
   * (These are just examples - use your actual dates)
   */
  startDate: '2025-10-11',
  
  /**
   * 📝 DISPLAY MESSAGES
   * 
   * Update these messages for each event
   */
  messages: {
    title: "Restaurant Week Coming Soon!",
    beforeStart: "Restaurant Week check-ins will be available starting October 11, 2025. Get ready to discover amazing local restaurants and earn raffle entries!",
    duringEvent: "Restaurant Week is active! Enter restaurant codes to check in and earn raffle entries."
  }
} as const;

/**
 * 🔧 UTILITY FUNCTIONS
 * 
 * Helper functions to check Restaurant Week status
 */
export const RestaurantWeekUtils = {
  /**
   * Check if Restaurant Week is currently active
   */
  isActive(): boolean {
    const startDate = new Date(`${RESTAURANT_WEEK_CONFIG.startDate}T00:00:00`);
    const currentDate = new Date();
    return currentDate >= startDate;
  },

  /**
   * Get days remaining until Restaurant Week starts
   * Returns 0 if already started
   */
  getDaysUntilStart(): number {
    const startDate = new Date(`${RESTAURANT_WEEK_CONFIG.startDate}T00:00:00`);
    const currentDate = new Date();
    
    if (currentDate >= startDate) return 0;
    
    return Math.ceil((startDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  },

  /**
   * Get a formatted display date for the start date
   */
  getFormattedStartDate(): string {
    const startDate = new Date(`${RESTAURANT_WEEK_CONFIG.startDate}T00:00:00`);
    return startDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};