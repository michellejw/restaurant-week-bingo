# Pleasure Island Restaurant Week Bingo

## Overview
A restaurant week bingo web application for a local chamber of commerce. Users collect squares on their bingo card by entering codes from participating restaurants, earning raffle entries based on their progress.

## Technical Stack
- React
- Next.js
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- Leaflet (Map Integration)

## Core Features

### Authentication
- Email/password authentication via Supabase
- Automatic sign-up flow with email verification
- Seamless login for existing users

### User Interface
- Modern, clean design with ample white space
- Coral accent color (implemented via Tailwind)
- Responsive design for both mobile and desktop
- Navigation bar for easy access to features

### Main Components
1. **Navigation**
   - Persistent navigation bar
   - Login/Signup button for unauthenticated users

2. **Restaurant Map**
   - Leaflet-based map auto-centered on restaurant locations
   - Interactive markers showing:
     - Restaurant name
     - Address
     - URL
   - Visual indication of visited restaurants

3. **Bingo Card**
   - Flexible grid layout adapting to:
     - Number of restaurants
     - Screen size
   - Visual indication of visited restaurants
   - Restaurant names displayed in squares

4. **Check-in System**
   - Simple form for entering restaurant codes
   - Visit counter/tally display
   - Automatic updates to:
     - Visit count
     - Bingo card
     - Map markers

### Raffle System
- Automatic entry based on progress
- One raffle entry for every 5 squares filled

### Data Management
- Restaurants and codes managed via Supabase admin dashboard
- Appropriate table permissions set in Supabase
- Visit tracking and tallying mechanism per user

## Future Features
- Admin dashboard (planned)

## NEXT STEPS
### Completed
- [x] Add QR code scanner to the check-in system: allow users to either scan a QR code or enter a simpler code manually. The check in system should include a button to "check in" that opens a modal to either scan a QR code or enter a simpler code manually.
- [x] Add chamber of commerce logo to the main page and the landing page
- [x] Adjust the text on the landing page to say (line 1): "Pleasure Island Chamber of Commerce presents" and (line 2): "Restaurant Week Bingo!"
- [x] Remove the sign in button from the navigation bar on the landing page when users are logged out. (but keep the log out button on the nav bar on the main page when users are logged in)
- [x] Add a separate page to list/summarize sponsors (add link to it on the nav bar)
- [x] Add page to describe how the bingo game works
- [x] Add a "contact us" page that includes the email, phone number, physical address, and URL for the chamber of commerce
- [x] On the landing page, where users are prompted to log in or sign up, add a button to "learn more" that opens a modal with a description of the bingo game and the rules.
- [x] Add a button for if people forget their password ?? (unless this is part of the auth0 implementation)
- [x] Set up proper email (SMTP) for production
- [x] Improve the sign-up experience by adding a way for users to view their password on the sign-up/log in page
- [x] Add the actual restaurant list instead of placeholder restaurants (and remove the placeholder restaurants)
- [x] Fix: map is not auto-centering to show all the restaurant locations
- [x] Add description to restaurant map pop-ups
- [x] Adjust the map markers so that they don't obscure each other when zoomed at the default zoom level. 
- [x] add a user settings page to allow users to update their name, email, and phone number, or to request a password reset. 
- [x] remove QR code scanning from the check-in system - codes only.
- [x] add restaurant phone number to the restaurant table
- [x] add restaurant phone number to the restaurant info pop-up
- [x] add a friendly message to the settings page to encourage users to complete their profile - thank them for supporting local eateries and drinkeries! and remind them that we'll need their contact info in case they win! Also note that they can update their profile at any time.

### Coming soon!
- [ ] add a special icon to the restaurant map for retail sponsors (like a shopping bag) - they should also have a pop up with extra info
- [ ] make the layout a vertical stack. stretch map across the page. Bingo card is below the map. check in button is above the map and should be stretched to the width of the map/page.
- [ ] create a new table for sponsors
- [ ] use that to populate the sponsors page

### To request from PICC
- [ ] Add actual sponsors: will need to create a new table in the database for sponsors, and then add the sponsors to the page. One column in the sponsors table will include the logo file name, if available. Other fields will include the name, address, phone number, URL, brief description, and promo offer, if available. The code should recognize if the optional fields are available in the database and display them accordingly (e.g., logo, promo offer).
- [ ] describethe prizes available via raffle, probably on the "how to play" page. (and generally review and update the how to play page)
- [ ] request a table with sponsors' info


## Ideas for future work (probably won't happen this time around)
- [ ] Add special login for restaurant owners to update their info (e.g. add a new location, update their description, etc.), upload a logo (strict on size and format), and add a promo offer. Should probably be a completely different login and signup process and the site will be very different (e.g. no bingo card, no map)
- [ ] Add a stats page for restaurants to view anonymized visit totals, etc. (e.g. # visits vs day of week, # visits vs time of day, etc.)
- [ ] consider setting up bingo card sorting so that it is different for different users. Or maybe have a shuffle button?? Maybe put visited restaurants at the top of the grid? 
- [ ] click on bingo card square to highlight the corresponding restaurant on the map
- [ ] revisit admin dashboard - so admins can directly add/edit restaurants, info, and codes. 