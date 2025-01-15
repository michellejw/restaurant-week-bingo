# Pleasure Island Restaurant Week Bingo

The big idea here is that we want to build a restaurant week bingo web app for a local chamber of commerce. Users should be able to easily log in and scan QR codes at restaurants to collect squares on their bingo cards (users should also be able to just use a short alphanumeric code if their phone doesn't have a camera). When they have different #'s of squares filled in, they are automatically entered into a raffle. Users should be able to login using simple email/password authentication to start with and eventually will add google/apple/facebook authentication.

Raffle entries should be based on number of squares filled in. Every 5 squares filled in should be an entry into the raffle.

The style of the app should be modern and sleek. We should use a lot of white space and clean lines. We should use an accent color to make certain features of the app pop, without being too distracting. (maybe a nice shade of purple)

The main page should have a map of the area with the restaurants marked on it. The map should be interactive and allow users to zoom in and out, and pan around. The map should automatically center on the restaurant locations. Map markers should be clickable and display the restaurant name, address, and URL.

We should use a responsive design that looks good on both mobile and desktop.

When a non-authenticated user visits the site, they should be directed to a landing page with a button to login. Once the user is logged in, there should be a logout button in the navbar.

Users should be able to view the map and the list of restaurants, but not add or edit any information. The view should be simple and easy to understand, and should be contained on a single page.

The bingo card should be a flexible grid of squares that have the name of the restaurant on them. The specific grid layout should adjust based on the number of restaurants and the screen size. When a QR code is scanned, the square should be set to a different color to indicate that the restaurant has been visited. Pins on the map should also change color similarly.

Please use react, next.js, tailwind, and typescript. 

Please use supabase for the database and prisma for the ORM.
