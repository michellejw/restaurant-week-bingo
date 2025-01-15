# Pleasure Island Restaurant Week Bingo

The big idea here is that we want to build a restaurant week bingo web app for a local chamber of commerce. Users should be able to easily log in and enter a code visible at each restaurant to collect squares on their bingo cards. When they have different #'s of squares filled in, they are automatically entered into a raffle. Users should be able to login using simple email/password authentication. 

Raffle entries should be based on number of squares filled in. Every 5 squares filled in should be an entry into the raffle.

The style of the app should be modern and sleek. We should use a lot of white space and clean lines. We should use an accent color to make certain features of the app pop, without being too distracting. (maybe a nice shade of purple).

  The flow should be like this:
  - there is a landing page that is very simple and if the user is not logged in, it shows a "log in or sign up" button
  - when the user clicks that button, it shows an email/password form. the button underneath those fields should say "log in or sign up". If the user is already in the database, they will just get immediately logged in. if not, a message pops up telling them to check their email to confirm the sign up. (supabase should send an email with a link). 
  - The main page once a user is logged in is simple and is just a map and a bingo card and a button to "check in" which should open up an entry form for users to enter a restaurant code.  There should also be a simple "tally" of # of restaurants visited somewhere near the top. 
  - The map should automatically center on the restaurant locations. Map markers should be clickable and display the restaurant name, address, and URL.
  - The bingo card should be a flexible grid of squares that have the name of the restaurant on them. The specific grid layout should adjust based on the number of restaurants and the screen size. 
  - When the user enters a valid code, it should add it to their tally of visits, the corresponding bingo card should change color, and the corresponding map marker should also change color.
  
We should use a responsive design that looks good on both mobile and desktop.

Please use react, next.js, tailwind, typescript, and supabase.

For now there is no admin dashboard view. We will add restaurants and codes using the supabase admin dashboard.

please be sure to correctly set all of the appropriate permissions for the supabase tables.

use leaflet for the map.

ensure there is a mechanism for tallying each user's visited restaurants and total tally. 

