import gameRules from '../../config/game-rules.json';

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
   * 🖼️ SEASON LOGO FILE
   *
   * Place the seasonal logo under /public and set this path.
   * Example: '/rest-week-logo-spring2026.png'
   */
  logoFile: '/rest-week-logo-spring2026.png',

  /**
   * 📅 RESTAURANT WEEK START DATE
   * 
   * Format: 'YYYY-MM-DD'
   * 
   * Just change this date for each Restaurant Week:
   * - Current: October 10, 2025 → '2025-10-10'
   * - Next could be: April 15, 2026 → '2026-04-15'  
   * - Following: October 10, 2026 → '2026-10-10'
   * 
   * (These are just examples - use your actual dates)
   */
  startDate: '2026-03-14',

  /**
   * 📅 RESTAURANT WEEK END DATE
   *
   * Format: 'YYYY-MM-DD'
   * Check-ins close at the end of this date.
   *
   * NOTE: Close check-ins on the Sunday morning after the last day at 6:00 AM ET.
   * Participants check in late at night (especially at bars), so don't cut off at midnight.
   */
  endDate: '2026-03-21',
  
  /**
   * 🧪 TESTING OVERRIDES
   * 
   * Safe ways to enable check-ins early for testing
   */
  testing: {
    /**
     * Always allow check-ins in development mode
     * (localhost and vercel preview deployments)
     */
    allowInDevelopment: true,
    
    /**
     * 🚨 EMERGENCY OVERRIDE 🚨
     * 
     * Set to true to bypass date restrictions in production
     * ⚠️  REMEMBER TO SET BACK TO FALSE BEFORE RESTAURANT WEEK!
     * ⚠️  This affects the live site!
     */
    forceEnableInProduction: false
  },
  
  /**
   * 📝 DISPLAY MESSAGES
   * 
   * Update these messages for each event
   */
  messages: {
    title: "Spring Restaurant Week Starts Soon!",
    beforeStart: "Restaurant Week check-ins will be available starting March 14, 2026. You can sign in now and get ready to discover amazing local restaurants and earn raffle entries!",
    duringEvent: "Restaurant Week is active! Enter restaurant codes to check in and earn raffle entries.",
    afterEndTitle: "Thanks For A Great Restaurant Week!",
    afterEnd: "Thanks for participating in Restaurant Week Spring 2026. Check-ins are now closed. See you next season!"
  }
} as const;

/**
 * 🎮 GAME CONFIGURATION
 *
 * Core game rules and operational settings.
 * These values control gameplay mechanics and system behavior.
 */
export const GAME_CONFIG = {
  /**
   * 🎟️ RAFFLE RULES
   */
  raffle: {
    /**
     * Number of restaurant check-ins required for one raffle entry.
     *
     * ⚠️ CRITICAL: This value MUST match the SQL trigger!
     * The database trigger at `supabase/fix-user-stats-triggers.sql` must use:
     *   FLOOR(visit_count / raffleRestaurantsPerEntry)
     *
     * If you change this value, you MUST also update the SQL trigger
     * and run a migration to recalculate existing raffle_entries.
     */
    restaurantsPerEntry: gameRules.raffleRestaurantsPerEntry,
  },

  /**
   * 🚦 RATE LIMITING
   *
   * Controls how often users can submit check-in requests.
   * Prevents abuse and accidental rapid submissions.
   */
  rateLimit: {
    /**
     * Maximum check-in requests allowed per time window.
     */
    maxRequestsPerWindow: 10,

    /**
     * Time window in milliseconds.
     * After this duration, the request count resets.
     */
    windowMs: 60_000, // 1 minute
  },
} as const;

/**
 * 🔧 UTILITY FUNCTIONS
 * 
 * Helper functions to check Restaurant Week status
 */
export const RestaurantWeekUtils = {
  isDevelopmentOverrideEnvironment(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const hostname = window.location.hostname;
    const configuredDevHost = process.env.NEXT_PUBLIC_DEV_HOSTNAME;
    const configuredProdHost = process.env.NEXT_PUBLIC_PROD_HOSTNAME;

    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isConfiguredDevHost = Boolean(configuredDevHost && hostname === configuredDevHost);
    const isVercelDeploymentHost = hostname.endsWith('.vercel.app');
    const isConfiguredProductionHost = Boolean(configuredProdHost && hostname === configuredProdHost);

    return process.env.NODE_ENV === 'development' ||
      isLocalhost ||
      isConfiguredDevHost ||
      (isVercelDeploymentHost && !isConfiguredProductionHost);
  },

  getPhaseByDateOnly(): 'before_start' | 'active' | 'after_end' {
    const startDate = new Date(`${RESTAURANT_WEEK_CONFIG.startDate}T00:00:00`);
    const endDate = new Date(`${RESTAURANT_WEEK_CONFIG.endDate}T23:59:59`);
    const currentDate = new Date();

    if (currentDate < startDate) {
      return 'before_start';
    }

    if (currentDate > endDate) {
      return 'after_end';
    }

    return 'active';
  },

  /**
   * Check if Restaurant Week is currently active
   * (includes testing overrides)
   */
  isActive(): boolean {
    // Check testing overrides first
    if (RESTAURANT_WEEK_CONFIG.testing.forceEnableInProduction) {
      return true;
    }
    
    // Always allow in development environments
    if (RESTAURANT_WEEK_CONFIG.testing.allowInDevelopment) {
      const isDevelopment = this.isDevelopmentOverrideEnvironment();
      
      if (isDevelopment) {
        return true;
      }
    }
    
    return this.getPhaseByDateOnly() === 'active';
  },
  
  /**
   * Check if Restaurant Week is active based ONLY on the date
   * (ignores all testing overrides)
   */
  isActiveByDateOnly(): boolean {
    return this.getPhaseByDateOnly() === 'active';
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

  getDaysUntilEnd(): number {
    const endDate = new Date(`${RESTAURANT_WEEK_CONFIG.endDate}T23:59:59`);
    const currentDate = new Date();

    if (currentDate > endDate) return 0;

    return Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
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
  },
  
  /**
   * Get status info for debugging/display
   */
  getStatusInfo() {
    const isDevelopment = this.isDevelopmentOverrideEnvironment();
    
    return {
      isDevelopment,
      phaseByDateOnly: this.getPhaseByDateOnly(),
      dateBasedActive: this.isActiveByDateOnly(),
      overrideActive: this.isActive(),
      daysUntilStart: this.getDaysUntilStart(),
      daysUntilEnd: this.getDaysUntilEnd(),
      config: {
        allowInDevelopment: RESTAURANT_WEEK_CONFIG.testing.allowInDevelopment,
        forceEnableInProduction: RESTAURANT_WEEK_CONFIG.testing.forceEnableInProduction,
        startDate: RESTAURANT_WEEK_CONFIG.startDate,
        endDate: RESTAURANT_WEEK_CONFIG.endDate,
      }
    };
  }
};
