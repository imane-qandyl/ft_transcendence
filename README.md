# ft_transcendence - Street Pixel Wars

Hey there!  Welcome to our **Street Pixel Wars** project - a gangster-themed PvP combat game that we built from scratch. Think old-school pixel art meets modern web tech, with a dash of organized crime flavor!

![Project Status](https://img.shields.io/badge/status-completed-success)
![Tech Stack](https://img.shields.io/badge/stack-Node.js%20|%20React%20|%20Phaser3-blue)
![Database](https://img.shields.io/badge/database-SQLite-orange)

##  What's This All About?

So here's the deal - We wanted to create something that felt like those classic gangster strategy games but with real-time multiplayer combat. You create your character (we spent way too much time on the pixel art sprites), battle other players, take over territories around the city, and work your way up the criminal ladder.

The combat is turn-based because we think it's more strategic than button mashing, and there's this whole territory system where you can literally own parts of the city and collect passive income. Plus we threw in a bunch of crime missions because... well, it's a gangster game! 

### What You Can Actually Do
- **Fight Other Players** - Turn-based combat with actual strategy involved
- **Take Over Territory** - 12 different spots around the city you can control
- **Pull Off Crimes** - 20+ different jobs from pickpocketing to bank heists
- **Level Up Your Character** - Customize your stats and unlock new abilities
- **Chat & Make Friends** - Because even criminals need friends, right?
- **Climb the Ranks** - ELO system so you fight people at your skill level

##  How We Built This Thing

### The Tech Stack (aka what we learned along the way)

#### Backend - The Engine Room
We went with **Fastify** instead of Express because it's faster and has better TypeScript support. The database is just SQLite (yeah, we know, not PostgreSQL, but it works perfectly for this scale and makes deployment so much easier).

For auth, we implemented proper JWT tokens AND added 2FA with Google Authenticator because we wanted to learn how that works. Real-time stuff is handled by Socket.IO - turns out synchronizing game state between players is trickier than we thought! 

- **Framework**: Fastify (Node.js) - fast and modern
- **Database**: SQLite with Knex.js - simple but powerful
- **Authentication**: JWT + 2FA - because security matters
- **Real-time**: Socket.IO - for live battles and chat
- **Security**: bcrypt, rate limiting, all the good stuff
- **Docs**: Swagger UI - so you can actually use our API

#### Frontend - The Pretty Stuff
React 18 because hooks are life, and Phaser 3 for the actual game graphics. We spent AGES getting the pixel art to look crisp on different screen sizes. Tailwind for styling because we're not CSS wizards, and it just works.

- **Framework**: React 18 - hooks everywhere!
- **Game Engine**: Phaser 3 - for that pixel-perfect retro feel
- **Routing**: React Router v6 - smooth navigation
- **Styling**: Tailwind CSS - we're not designers, this helps
- **HTTP Client**: Axios - reliable API calls
- **Real-time**: Socket.IO Client - for live game updates

#### DevOps & Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **SSL/TLS**: Automated certificate generation
- **Process Management**: PM2 for production deployment
- **Database Management**: Knex.js migrations with seed data

##  Want to Try It Out?

### You'll Need
- Node.js 18+ (and npm, obviously)
- Docker and Docker Compose (trust me, it's easier this way)
- Git (you probably have this already)

### Getting It Running

1. **Grab the code**
   ```bash
   git clone <repository-url>
   cd final
   ```

2. **One command to rule them all**
   ```bash
   make
   ```
   We set up a Makefile because we got tired of typing long Docker commands. This will:
   - Build everything in Docker containers
   - Generate SSL certificates (because Chrome is picky)
   - Start the backend and frontend
   - Set up the database with some test data

3. **Check it out**
   ```
   https://localhost:8443
   ```
   
   (Yeah, it's HTTPS. Local development with SSL certificates because we wanted to learn how to do it properly!)

### Alternative Setup Methods

#### Manual Docker Setup
```bash
# Build containers
docker compose build

# Generate SSL certificates
docker compose up ssl-generator

# Start services
docker compose up -d backend frontend
```

#### Development Mode
```bash
# Backend development
cd backend
npm install
npm run dev

# Frontend development (separate terminal)
cd frontend
npm install
npm start
```

##  Game Features

### 1. Character System
- **Multiple Character Slots** per user account
- **Stat Allocation** (Strength, Speed, Defense, Luck)
- **Level Progression** with experience points
- **Character Customization** with different sprites and themes

### 2. Combat System
- **Turn-based Strategy** with action selection (Attack, Defend, Special)
- **Speed-based Turn Order** determines who acts first
- **Critical Hit System** with luck-based mechanics
- **Damage Calculation** incorporating all character stats
- **Victory Conditions** with comprehensive battle results

### 3. Territory Wars (My Favorite Feature)
Okay, this is where I got really excited. I created 12 different territories around the city, each with their own vibe:
  - **Downtown** (the good stuff): Casino, Bank, Nightclub District
  - **Industrial** (gritty): Warehouses, Docks, Factory District  
  - **Suburbs** (easier targets): Shopping Mall, Corner Store, Gas Station
  - **Red Light District** (because every gangster game needs one)

Once you control a territory, it generates passive income every hour. So you can literally wake up richer! The battles use your character's power level, but there's also strategy involved - some territories are harder to take but worth more money.

### 4. Crime Spree (Because Why Not?)
We went a bit overboard with the crime system - there are over 20 different jobs you can pull:
  - **Starting Out**: Pickpocketing tourists, robbing corner stores (we all start somewhere)
  - **Getting Serious**: Burglary, drug running, a little extortion
  - **Big League**: Car theft, weapons smuggling (now we're talking)
  - **Legendary**: Bank heists, casino jobs, high-profile hits

Each crime costs energy and has a success rate based on your level. Fail a bank heist at level 5? Yeah, that's going to hurt. But succeed at a high-level crime and you'll be rolling in cash and XP!

Energy regenerates over time, so you can't just grind crimes all day (learned that balance lesson the hard way during testing).

### 5. Social Features
- **Real-time Chat System** with persistent message history
- **Friends Management** with request/accept/decline functionality
- **User Blocking** and privacy controls
- **Match History** tracking with detailed statistics
- **Leaderboards** for top criminals and PvP fighters
- **Notification System** for game events

### 6. Economic System
- **Multi-currency Economy**: Coins and Experience Points
- **Shop System** for character upgrades and customization
- **Stat Point Allocation** for character build diversity
- **Progressive Costs** to maintain game balance

##  API Documentation

### RESTful Endpoints
- `/auth/*` - Authentication and user management
- `/characters/*` - Character CRUD operations
- `/matches/*` - Match creation and history
- `/territories/*` - Territory information and battles
- `/crimes/*` - Crime activities and attempts
- `/chat/*` - Chat functionality and history
- `/friends/*` - Social features and friend management
- `/shop/*` - In-game purchases and upgrades

### WebSocket Events
- **Match Events**: Turn actions, state updates, battle results
- **Chat Events**: Real-time messaging and notifications
- **Game Events**: Territory updates, crime completions
- **System Events**: Friend requests, notifications

Access the interactive API documentation at `http://localhost:3000/docs` when running the backend.

##  Database Schema

### Core Game Tables
- **users** - Authentication and profile data
- **characters** - Player game profiles with stats
- **matches** - PvP match records and results
- **character_resources** - Energy and progression tracking

### Territory System
- **territories** - Territory definitions and properties
- **territory_ownership** - Current territory control state
- **territory_battles** - Battle history and outcomes

### Crime System
- **crime_activities** - Available crime mission definitions
- **crime_attempts** - Player crime history and results

### Social Features
- **friendships** - Friend relationships and status
- **chat_participants** - Chat room membership
- **chat_messages** - Persistent message storage
- **notifications** - System and user notifications

##  Game Balance & Mechanics

### Character Progression
- **Level-based Scaling** with exponential XP requirements
- **Stat Point Distribution** for character customization
- **Equipment System** (planned expansion)
- **Skill Unlock Requirements** based on level milestones

### Combat Balance
- **Speed Determines Turn Order** for strategic positioning
- **Critical Chance Scaling** requires investment for effectiveness
- **Luck Provides Miss Chance** as defensive mechanism
- **Defense Actions** provide damage reduction options
- **Level Differences** affect success rates and damage

### Economic Balance
- **Territory Income Scaling** by zone difficulty and value
- **Crime Reward Scaling** by risk level and requirements  
- **Energy Limitations** prevent excessive grinding
- **Progressive Difficulty Curves** maintain long-term engagement

##  Security Features

### Authentication & Authorization
- **JWT Token Authentication** with secure secret management
- **Two-Factor Authentication (2FA)** using time-based OTP
- **Google OAuth Integration** for convenient sign-in
- **Password Security** with bcrypt hashing and salt
- **Session Management** with token expiration

### API Security
- **Rate Limiting** to prevent abuse and spam
- **CORS Configuration** for cross-origin request control
- **Input Validation** using comprehensive schemas
- **SQL Injection Prevention** with parameterized queries
- **Error Handling** without information disclosure

### Game Security
- **Server-side Validation** of all game actions
- **Anti-cheat Measures** in combat calculations
- **Resource Validation** for energy and currency systems
- **Transaction Integrity** for database operations

##  Project Structure

```
├── backend/                    # Node.js/Fastify API server
│   ├── controllers/           # HTTP request handlers
│   ├── services/             # Business logic layer
│   ├── models/               # Database models
│   ├── routes/               # API route definitions
│   ├── middleware/           # Authentication & validation
│   ├── migrations/           # Database schema evolution
│   ├── seeds/               # Initial data population
│   └── socketHandlers/      # WebSocket event handlers
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page-level components
│   │   ├── game/           # Phaser 3 game logic
│   │   ├── services/       # API communication layer
│   │   └── contexts/       # React Context providers
│   └── public/             # Static assets and sprites
├── ssl/                      # SSL certificate storage
├── docker-compose.yml        # Container orchestration
└── Makefile                 # Build and deployment automation
```

##  Deployment

### Production Deployment
```bash
# Build optimized containers
docker compose -f docker-compose.prod.yml build

# Deploy with SSL
docker compose -f docker-compose.prod.yml up -d

# Check service status
docker compose ps
```

### Environment Configuration
Create environment files for different deployment scenarios:
- `.env.development` - Local development settings
- `.env.production` - Production environment variables
- `.env.test` - Testing configuration

### Database Management
```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed

# Rollback migration
npm run migrate:rollback
```

##  Testing & Quality Assurance

### Backend Testing
- **Unit Tests** for service layer logic
- **Integration Tests** for API endpoints
- **Database Tests** for migration integrity
- **Security Tests** for authentication flows

### Frontend Testing
- **Component Tests** using React Testing Library
- **Game Logic Tests** for Phaser 3 mechanics
- **End-to-End Tests** for user workflows
- **Performance Testing** for game responsiveness

##  Performance Considerations

### Backend Optimization
- **Database Indexing** on frequently queried columns
- **Connection Pooling** for efficient database usage
- **Rate Limiting** to prevent resource exhaustion
- **Caching Strategies** for static game data

### Frontend Optimization
- **Code Splitting** for faster initial load times
- **Asset Optimization** for sprite and image compression
- **Lazy Loading** for non-critical components
- **Memory Management** in Phaser 3 scenes

##  Contributing

### Development Workflow
1. Fork the repository and create a feature branch
2. Follow the established code style and conventions
3. Write tests for new functionality
4. Update documentation as needed
5. Submit a pull request with detailed description

### Code Style Guidelines
- **Backend**: ESLint with Airbnb configuration
- **Frontend**: Prettier with React best practices
- **Database**: Consistent naming conventions
- **Comments**: JSDoc for functions and classes

##  What I'm Proud Of

### The Technical Stuff That Actually Works
- **Built a full multiplayer game** from scratch (and it doesn't crash!)
- **Real-time combat synchronization** between players (this was HARD)
- **Proper security** with 2FA because I wanted to do it right
- **Clean API design** with documentation (future us will thank past us)
- **Database that makes sense** and doesn't fall over under load

### The Game Design Wins
- **Actually fun to play** (we've spent way too many hours testing it)
- **Balanced progression** - no pay-to-win nonsense here
- **Social features that work** - the chat system is surprisingly robust
- **Pixel art that doesn't hurt your eyes** (took forever to get right)
- **Feature-complete** - everything you'd expect from a modern web game

### Development Best Practices
- **Clean Code Architecture** with separation of concerns
- **Comprehensive Error Handling** with user-friendly messages
- **Database Migration System** for schema version control
- **Docker Containerization** for consistent deployments
- **Automated Build Process** with Make commands

##  Future Enhancements

### Planned Features
- **Guild/Gang System** for group play and territory wars
- **Equipment and Crafting** system for character enhancement
- **Daily Quests** and time-limited events
- **Mobile App** with React Native
- **Tournament System** for competitive organized play

### Technical Improvements
- **Redis Caching** for improved performance
- **Microservices Architecture** for better scalability
- **Advanced Analytics** for player behavior tracking
- **CI/CD Pipeline** with automated testing and deployment
- **Load Balancing** for high-availability production setup

##  License

This project is developed as part of the ft_transcendence curriculum and is intended for educational purposes.

##  The Dream Team

This project was built by our awesome team of 5 developers as part of the 42 School ft_transcendence curriculum. And wow, what a journey it's been working together!

### How We Divided and Conquered
- **Full-Stack Architecture** - Collaborative system design and planning
- **Game Mechanics Development** - Combat system, territory control, crime activities
- **Database Design & Implementation** - Schema design, migrations, and optimization
- **API Development** - RESTful endpoints, WebSocket integration, and documentation  
- **Frontend & Game Development** - React components, Phaser 3 integration, and UI/UX
- **Security Implementation** - Authentication, authorization, 2FA, and data protection
- **DevOps & Deployment** - Docker containerization, SSL setup, and deployment automation

### The Challenges That United Us
- **Real-time game synchronization** - Getting multiple players in sync without lag
- **Complex database relationships** - Making sure everything connects properly
- **Performance optimization** - Keeping the game smooth and responsive
- **Security vs usability** - Balancing strong security with great user experience  
- **Cross-browser compatibility** - Making sure it works everywhere
- **Team coordination** - Managing a full-stack project across multiple developers

Working as a team taught us so much about collaboration, code reviews, and building something bigger than any of us could have created alone. The best part? We actually had fun doing it! 

### What We All Learned
Honestly, this project taught us more about real-world development than most of our formal courses. Nothing beats the experience of building something from scratch with a team, dealing with merge conflicts, coordinating features, and seeing it all come together into something that actually works and is genuinely fun to play! 

---

**Want to check it out?** Fire it up at https://localhost:8443  
**Curious about the API?** Check out the docs at http://localhost:3000/docs  
**Status**:  Actually works and is pretty fun!
