# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chinese Valentine's Day (七夕) couple matching web application built with React and TypeScript. The app features an innovative "constellation connection" UI where users select interests as stars that form connections, avoiding traditional "filling bottles" mechanics. The system calculates compatibility between two users and recommends personalized dating activities.

## Development Commands

### Essential Commands
- `npm start` - Start development server on localhost:3000
- `npm run build` - Create production build in `build/` directory
- `npm test` - Run tests in interactive watch mode
- `npm run eject` - Eject from Create React App (one-way operation)

### Testing
- **Note**: Currently using Create React App's test setup with React Testing Library
- Tests are located in `src/__tests__` directory (if any)
- Run specific test file: `npm test filename.test.tsx`

### Deployment
- `vercel deploy --yes --prod` - Deploy to production Vercel environment
- `vercel deploy --yes` - Deploy to preview environment
- **EdgeOne Pages Deployment**: Use MCP tool `mcp__edgeone-pages-mcp-server__deploy_folder_or_zip` with the build directory

## Architecture Overview

### Core Components
1. **App.tsx** - Main orchestrator with stage-based navigation (welcome → user1 → user2 → results)
2. **ConstellationMap.tsx** - Canvas-based interactive star map where interests are displayed as clickable stars with dynamic connections
3. **InterestSelector.tsx** - Category-based interest selection with importance scoring (1-5 stars)
4. **MatchResults.tsx** - Comprehensive results display showing compatibility scores and activity recommendations

### Data Flow
- User inputs flow through App stage management
- Interest selection managed locally in each component with callbacks to parent
- MatchingEngine processes both users' interests to generate MatchResult
- Results include overall score, category scores, common/unique interests, and activity recommendations

### Key Architecture Patterns
- **Stage-based UI**: Single App component manages flow between welcome, user selection, and results
- **Canvas Visualization**: Custom star rendering with mouse interaction for constellation effect
- **Algorithmic Matching**: Multi-dimensional scoring considering interest overlap and importance weights
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures

### Styling System
- **Tailwind CSS** with custom color palette (qixi-pink, qixi-purple, qixi-blue, qixi-gold)
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Glass-morphism**: Background blur effects for modern UI aesthetic

### Matching Algorithm Logic
The MatchingEngine class implements:
- **Category Scoring**: Calculates compatibility per interest category (entertainment, sports, food, travel)
- **Importance Weighting**: User-assigned importance (1-5) affects match scores
- **Activity Recommendations**: Pre-defined activities scored by category relevance and user interests
- **Result Generation**: Comprehensive match report with personalized suggestions

### Technical Considerations
- **React Hooks**: Extensive use of useState, useCallback, useEffect with proper dependency management
- **Canvas Performance**: Optimized rendering with useCallback to prevent unnecessary redraws
- **TypeScript**: Strong typing throughout with interfaces for all data structures
- **No External State**: All state managed locally within components (no Redux/Context)

### Development Notes
- ESLint treats warnings as errors in CI builds
- Vercel deployment configured with custom routing for SPA support
- Chinese language interface with emoji icons for visual appeal
- Canvas drawing logic consolidated to avoid React hook dependency issues
- **Project Structure**: Single React application in `qixi-match/` directory with standard Create React App structure
- **React Version Compatibility**: Using React 18.3.1 for compatibility with Create React App 5.0.1 (React 19+ may cause blank page issues)

### Session Management
- `SessionManager` handles persistent user sessions between both participants
- Sessions stored in localStorage with URL-based sharing
- Each session generates unique ID for sharing between users
- Automatic session restoration on page reload

### Canvas Implementation
- `ConstellationMap` component uses HTML5 Canvas for interactive star visualization
- Stars positioned in circular layout with dynamic connections
- Performance optimized using useCallback hooks to prevent unnecessary redraws
- Mouse interaction handling for hover effects and interest selection