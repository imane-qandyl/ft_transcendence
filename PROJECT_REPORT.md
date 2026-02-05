# ft_transcendence - Project Report

## Executive Summary

ft_transcendence is a modern full-stack web application featuring a **Street Pixel Wars** gangster-themed PvP combat game. The project combines real-time multiplayer gaming with social features, implementing a comprehensive turn-based combat system with RPG elements, territory control mechanics, and crime activities.

## Project Architecture

### Technology Stack

#### Backend
- **Framework**: Fastify (Node.js)
- **Database**: SQLite with Knex.js migrations
- **Authentication**: JWT tokens with 2FA support
- **Real-time Communication**: Socket.IO
- **Security**: bcrypt, rate limiting, CORS
- **API Documentation**: Swagger/OpenAPI

#### Frontend  
- **Framework**: React 18
- **Game Engine**: Phaser 3
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

#### Development Tools
- **Package Management**: npm
- **Database Migrations**: Knex.js
- **Development**: nodemon, hot reload
- **Process Logging**: Pino

## Core Features

### 1. Authentication System
- **JWT-based authentication** with secure token management
- **Two-Factor Authentication (2FA)** using TOTP
- **Google OAuth integration** for social login
- **Rate limiting** for security protection
- **Password hashing** with bcrypt

### 2. Character Management System
- **Multiple character slots** (unlocked by level progression)
- **Six character classes** with unique stat distributions:
  - Pink (Balanced): Well-rounded stats
  - Owlet (Tank): High HP and defense
  - Dude (Brawler): High attack, low defense
  - Warrior (Attacker): Focused on damage output
  - Mage (Crit): High critical chance and speed
  - Rogue (Lucky): High luck and evasion
- **RPG progression**: Level, experience, stat points
- **Customizable appearance**: Body, hair, outfit sprites

### 3. Real-time PvP Combat System
- **Turn-based combat** with action selection
- **Advanced damage calculations** including:
  - Base attack vs defense scaling
  - Critical hit system with level scaling
  - Luck-based miss chances
  - Defense actions that reduce incoming damage
- **Action types**: Attack, Defend, Special abilities
- **Combat states**: Health tracking, turn management
- **Real-time updates** via WebSocket

### 4. Gangster Game Mechanics

#### Territory Control System
- **12 capturable territories** across different zones:
  - Downtown (high value): Casino, Bank, Nightclub District
  - Industrial: Warehouses, Docks, Factory
  - Suburbs: Mall, Store, Gas Station
  - Special: Red Light District
- **Passive income generation** from controlled territories
- **Territory battles** with power calculations
- **Defense strength** mechanics for territory protection

#### Crime Activities System
- **20+ crime missions** with varying difficulty levels
- **Energy-based gameplay** with regeneration mechanics
- **Risk vs reward** scaling by difficulty and level requirements
- **Crime categories**:
  - Easy: Pickpocketing, corner store robbery
  - Medium: Burglary, drug running, extortion
  - Hard: Car theft, weapons smuggling
  - Extreme: Bank heists, casino heists, assassinations
- **Dynamic success rates** based on character level
- **Experience and coin rewards** for successful crimes

### 5. Social Features
- **Friend system** with friend requests and management
- **Real-time chat** with message history
- **User blocking** and privacy controls
- **Match history** and statistics tracking
- **Leaderboards** for top criminals and fighters

### 6. Game Economy
- **Multi-currency system**: Coins, experience points
- **Shop system** for character upgrades
- **Stat point allocation** for character customization
- **ELO rating system** for competitive matchmaking

## Database Schema

### Core Tables
- **users**: Authentication and profile data
- **characters**: Player game profiles with stats
- **matches**: PvP match records and results
- **tournaments**: Tournament organization (future expansion)

### Game Systems
- **territories**: Territory definitions and properties
- **territory_ownership**: Current territory control
- **territory_battles**: Battle history and outcomes
- **crime_activities**: Available crime missions
- **crime_attempts**: Player crime history
- **character_resources**: Energy and progression tracking

### Social Features
- **friendships**: Friend relationships
- **chat_participants**: Chat room membership
- **chat_messages**: Message storage
- **notifications**: System notifications

## API Architecture

### RESTful Endpoints
- `/auth/*`: Authentication and user management
- `/characters/*`: Character CRUD operations
- `/matches/*`: Match creation and history
- `/territories/*`: Territory information and battles
- `/crimes/*`: Crime activities and attempts
- `/chat/*`: Chat functionality
- `/friends/*`: Social features
- `/shop/*`: In-game purchases

### WebSocket Events
- **Match events**: Turn actions, state updates, results
- **Chat events**: Real-time messaging
- **Notification events**: System alerts
- **Game events**: Territory updates, crime completions

## Game Balance & Progression

### Character Progression
- **Level-based scaling** with experience requirements
- **Stat point distribution** for customization
- **Equipment and upgrade systems** (planned)
- **Skill unlock requirements** based on level

### Combat Balance
- **Speed determines turn order**
- **Critical chance scales inversely with level** (requires investment)
- **Luck provides miss chance** against opponents
- **Defense actions provide damage reduction**
- **Level differences affect success rates**

### Economic Balance
- **Territory income scaling** by zone and difficulty
- **Crime reward scaling** by risk and level requirements
- **Energy limitations** prevent grinding
- **Progressive difficulty** maintains engagement

## Security Implementation

### Authentication Security
- **JWT token expiration** and refresh mechanisms
- **Password complexity requirements**
- **2FA for enhanced security**
- **Rate limiting** on sensitive endpoints
- **CORS configuration** for cross-origin requests

### Data Protection
- **Input validation** on all endpoints
- **SQL injection prevention** via parameterized queries
- **XSS protection** through data sanitization
- **Authorization checks** on all protected routes
- **Session management** with secure cookies

## Performance Optimizations

### Database Performance
- **Proper indexing** on frequently queried columns
- **Foreign key constraints** for data integrity
- **Connection pooling** for efficient database access
- **Query optimization** with proper joins and limits

### Real-time Performance
- **Efficient WebSocket handling** with room management
- **State synchronization** between clients
- **Connection management** with cleanup on disconnect
- **Event throttling** to prevent spam

## Development Workflow

### Setup Process
1. **Backend**: `npm install` → `npm run setup` → `npm run dev`
2. **Frontend**: `npm install` → `npm start`
3. **Database**: Automatic migration and seeding
4. **Development**: Hot reload enabled for both layers

### Migration System
- **Versioned database migrations** with rollback support
- **Seed data** for territories and crime activities
- **Development vs production** environment handling
- **Database backup and recovery** procedures

## Testing & Quality Assurance

### Code Quality
- **ESLint configuration** for consistent code style
- **Error handling** with custom error classes
- **Logging system** with different log levels
- **Environment-based configuration**

### Game Testing
- **Combat balance testing** through simulation
- **Economy balance** with reward calculations
- **Real-time communication** stress testing
- **Cross-browser compatibility** validation

## Deployment Architecture

### Production Considerations
- **Environment variables** for configuration
- **Production logging** with rotation
- **Static file serving** optimization
- **Database performance** tuning
- **Security hardening** for production

### Scalability Planning
- **Database migration** to PostgreSQL for production
- **Redis integration** for session management
- **Load balancing** for high traffic
- **CDN integration** for static assets

## Future Enhancements

### Planned Features
1. **Gang System**: Player organizations with shared territories
2. **Advanced Combat**: Special abilities and equipment
3. **Tournament System**: Organized competitive events
4. **Mobile App**: React Native companion application
5. **Achievement System**: Rewards for various accomplishments

### Technical Improvements
1. **Microservices Architecture**: Separate game logic services
2. **Advanced Analytics**: Player behavior tracking
3. **AI Opponents**: Computer-controlled enemies
4. **Blockchain Integration**: NFT characters and items (optional)

## Conclusion

ft_transcendence represents a sophisticated gaming platform that successfully combines modern web technologies with engaging gameplay mechanics. The project demonstrates strong architectural decisions, comprehensive feature implementation, and scalable design patterns. The gangster theme provides an engaging context for the RPG and PvP elements, while the social features create opportunities for community building.

The codebase shows attention to security, performance, and maintainability, making it suitable for both educational purposes and potential commercial development. The modular architecture allows for easy expansion and feature additions, positioning the project for future growth and enhancement.

---

*Report generated on February 5, 2026*
*Project Status: Active Development*
*Code Quality: Production Ready*