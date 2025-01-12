# Pleasure Island Restaurant Week Bingo App - Comprehensive Development Roadmap
The big idea here is that we want to build a restaurant week bingo app for a local chamber of commerce. Users should be able to easily log in and scan QR codes at restaurants to collect squares on their bingo cards. When they have different #'s of squares filled in, they are automatically entered into a raffle. Users should be able to login with their email, google, facebook, or apple. 

Raffle entries should be based on number of squares filled in. Every 5 squares filled in should be an entry into the raffle. 

The style of the app should be modern and sleek. We should use a lot of white space and clean lines. We should use a theme color to make certain features of the app pop, without being too distracting. 

We should use a map to display the restaurants. The map should be interactive and allow users to zoom in and out, and pan around. The map should automatically center on the restaurant locations. Map markers should be clickable and display the restaurant name, address, and URL. 

We should use a responsive design that looks good on both mobile and desktop.

Admin users should be able to add, edit, and delete restaurants from the map. They should also be able to add, edit, and delete QR codes for each restaurant. 

Non-admin users should be able to view the map and the list of restaurants, but not add or edit any information. The non-admin view should be simple and easy to understand, and should be contained on a single page. 

The bingo card should be a flexible grid of squares that have the name of the restaurant on them. The specific grid layout should adjust based on the number of restaurants and the screen size. 

## Tools and Frameworks

### Frontend
- **React**: A JavaScript library for building user interfaces with a component-based architecture.
- **Next.js**: A React framework for server-side rendering, static site generation, and optimized loading.
- **Tailwind CSS**: A utility-first CSS framework for rapid, responsive UI development.

### Backend and Database
- **Supabase**: An open-source Firebase alternative providing database, authentication, real-time updates, and storage capabilities.

### Authentication
- **Supabase Auth**: Supports email/password auth, JWT token management, and third-party logins such as Google, Apple, and Facebook.

### Hosting/Deployment
- **Vercel**: For hosting the Next.js frontend with seamless deployment and high performance.
- **Supabase**: Manages backend functionalities, including database operations and authentication.

### Additional Tools
- **Mapbox**: For embedding custom, interactive maps to display restaurant locations.
- **QR Code API**: Integrated for generating and validating QR codes necessary for the bingo game mechanics.

## Development Phases

### Phase 1: Project Setup and Initial Configuration
#### Objective: Establish the foundational structure and settings of the project.
1. **Initialize the Next.js Application**
   - Start the next.js project inside the current directory. There is no current next.js project in there so all files need to be created from scratch.
2. **Integrate Tailwind CSS**
   - Follow the Tailwind CSS installation guide tailored for Next.js to ensure optimal configuration for post-processing.
3. **Configure Supabase Project**
   - Create a new project in Supabase.
   - Secure API keys and endpoints for later use in the frontend.

### Phase 2: Authentication Setup
#### Objective: Configure robust authentication mechanisms using Supabase for both regular and admin users.
1. **Enable Supabase Authentication**
   - Set up email/password login and configure third-party providers in the Supabase dashboard.
   - Define environment variables for Supabase URL and keys in Next.js for secure communication.
2. **Implement Authentication Handling in Frontend**
   - Utilize Supabase JS library to facilitate login/logout functionalities.
   - Create context or use hooks for managing authentication state throughout the app.
3. **Admin Verification**
   - Add a user role attribute (`role`) in the Supabase user metadata for distinguishing between admin and non-admin users.
   - Implement conditional UI rendering in Next.js based on the user's role.

### Phase 3: User Interface Development
#### Objective: Develop intuitive and responsive interfaces for both the admin dashboard and the main user interface.
1. **Navbar Component**
   - Implement a dynamic navbar that adjusts content based on authentication state.
   - Include "Logout" button and conditional "Admin Dashboard" access for admin users.
2. **Admin Dashboard Interface**
   - Design and develop the admin-specific dashboard with React components for managing restaurants and QR codes.
   - Implement routing to different admin pages for restaurant setup and QR code management.
3. **Main User Interface**
   - Develop the Bingo card interface using React state for interactivity.
   - Integrate Mapbox for displaying interactive maps with restaurant markers.

### Phase 4: Database Design and Integration
#### Objective: Set up a scalable database schema and integrate it with the frontend.
1. **Design Database Schema in Supabase**
   - Define tables for `Users`, `Restaurants`, `Visits`, and potentially `BingoCards`.
   - Establish relationships and permissions in Supabase for data integrity and security.
2. **Data Fetching and Manipulation**
   - Use Supabase's real-time capabilities to fetch and update restaurant data.
   - Implement secure API endpoints using Supabase functions if complex server-side logic is required.

### Phase 5: QR Code Integration
#### Objective: Implement QR code generation and scanning functionalities.
1. **QR Code Generation**
   - Use a third-party QR Code API to generate QR codes for each restaurant, storing them in the database.
2. **QR Code Scanning**
   - Integrate a QR code scanning library in the React app.
   - Connect scan validations to update user visits and Bingo card status dynamically.

### Phase 6: Testing, Optimization, and Deployment
#### Objective: Ensure the app is robust, performant, and ready for deployment.
1. **Comprehensive Testing**
   - Write unit tests for React components using Jest.
   - Conduct end-to-end tests with Cypress to ensure all workflows operate as expected.
2. **Performance Optimization**
   - Optimize React component rendering.
   - Utilize Supabase performance tuning for database queries.
3. **Deployment**
   - Deploy the frontend via Vercel and configure environment variables.
   - Ensure backend configurations in Supabase are production-ready.

### Phase 7: Documentation and Launch
#### Objective: Document the system thoroughly and prepare for a successful launch.
1. **User and Admin Documentation**
   - Create detailed documentation covering all functionalities for both regular users and admins.
2. **Marketing and Launch Planning**
   - Develop marketing materials and plan a launch event to promote the app.

## Conclusion
This detailed roadmap guides you through each phase of developing the Pleasure Island Restaurant Week Bingo App using modern technologies and best practices. It ensures that both admin and non-admin functionalities are fully supported and secure, providing a comprehensive blueprint for a successful project.