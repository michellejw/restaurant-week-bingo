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

### Coming soon!
- [x] Add the actual restaurant list instead of placeholder restaurants (and remove the placeholder restaurants)
- [x] Fix: map is not auto-centering to show all the restaurant locations
- [x] Add description to restaurant map pop-ups
- [ ] Add actual sponsors: will need to create a new table in the database for sponsors, and then add the sponsors to the page. One column in the sponsors table will include the logo file name, if available. Other fields will include the name, address, phone number, URL, brief description, and promo offer, if available. The code should recognize if the optional fields are available in the database and display them accordingly (e.g., logo, promo offer).
- [ ] Request that users provide a phone number on sign-up to help with prize fulfillment
- [ ] Create a script for generating the bingo posters for each restaurant. This should include the restaurant name, the QR code, and the manual check-in code, probably on an 8.5x11 sheet of paper.
- [ ] describethe prizes available via raffle, probably on the "how to play" page. 
- [x] Adjust the map markers so that they don't obscure each other when zoomed at the default zoom level. 
- [ ] Consider creating a page for logged in users to view their info, e.g. visit and raffle entry totals, name, email, phone number.

### Things to ask PICC
- do we still want sponsor info? 
- what are the rules for the raffle? e.g. how many many restaurants need to be visited to earn a raffle ticket? What are the prizes? How many prizes are there?