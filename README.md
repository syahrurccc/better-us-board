# Better Us Board

Better Us Board is a relationship-focused issue-tracking platform inspired by tools like Jira and Trello. It provides couples with a structured, safe, and collaborative space to express concerns, track emotional “tickets,” and work together toward healthier communication. Built with Node.js, Express, TypeScript, MongoDB, EJS, and Tailwind CSS, the app combines a soft-themed UI with a production-ready backend architecture.

##  Features
### Core Functionality
- **Shared Relationship Board**\
Automatically created when two users connect; holds all tickets and activities.
- **Ticketing System for Couples**\
Create, categorize, assign, and discuss issues in a structured workflow.
- **Categories & Severity Levels**\
Communication, household, finance, wellbeing, and more — each with severity tags.
- **Comments & Discussions**\
Each ticket supports threaded conversation to help clarify and resolve concerns.

### Authentication & Security
- **JWT Access Tokens + HttpOnly Refresh Tokens**\
Secure, production-grade session management with automatic token renewal.
- **Protected Routes & Authorization Checks**\
Users can only access boards and tickets that belong to their partnership.
- **Middleware-Driven Architecture**\
Centralized error handling, logging, auth, and request validation.

### UI & UX
- **Soft Peach-Themed Interface**\
A calming, minimal design tailored for emotional safety and clarity.
- **Responsive EJS Views**\
Server-rendered pages powered by Tailwind CSS and reusable components.
- **Clear Onboarding Flow**\
Register, login, connect with a partner, and collaborate seamlessly.

## Tech Stack & Design Choices
| Technology               | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| **Node.js + Express**    | Lightweight, modular API architecture                      |
| **TypeScript**           | Type safety across routes, services, and middleware        |
| **MongoDB + Mongoose**   | Flexible schema for tickets, boards, comments, connections |
| **Zod**                  | Input validation ensuring predictable API behavior         |
| **JWT + Refresh Tokens** | Stateless, secure authentication model                     |

| Technology                 | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| **EJS Templates**          | Simple server-rendered views without SPA complexity    |
| **Tailwind CSS (via CLI)** | Easy theming, responsive layouts, custom color palette |
| **Reusable Components**    | Buttons, forms, layouts included via EJS partials      |

## Possible Future Improvements
### Technical Enhancements
- **Real-Time Updates (WebSockets/SSE)**\
Live ticket activity, typing indicators, partner presence.
- **Activity Feed + History Tracking**\
Timeline of all changes for better context and reflection.
- **File Attachments**\
Allow screenshots, documents, or notes inside tickets.
- **Push Notifications or Email Alerts**\
Reminders for unresolved issues or scheduled relationship check-ins.

### UX Improvements
- **More Advanced Board Views**\
Kanban-style drag-and-drop lanes, filters, and sorting.
- **Calendar + Rituals System**\
Weekly check-ins, anniversaries, shared “relationship goals.”
- **Insights Dashboard**\
Automatically analyze patterns (e.g., communication trends, most common categories).

### Security & Production
- **Role-Based Access Policies**\
For future group contexts or external moderators.
- **Rate Limiting + Brute Force Protection**\
Protect login and invitation flows.
- **Deployment with Docker & Caddy**\
Self-hosted reverse proxy with HTTPS auto-configured.

## Getting Started
```
# install dependencies
npm install

# copy env example
cp .env.example .env

# start dev server (API)
npm run dev

# start Tailwind watcher
npm run dev:css
```
Open the app at:
```
http://localhost:3000
```