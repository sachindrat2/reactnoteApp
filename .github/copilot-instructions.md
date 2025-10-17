# Copilot Instructions for Notes App

## Architecture Overview

This is a **React + Vite** notes application with authentication, following a **service-context pattern** for state management and API interaction.

### Core Structure
- **Authentication Flow**: `App.jsx` → `AuthContext` → conditional rendering (`LoginScreen` or `NotesApp`)
- **State Management**: React Context (`AuthContext`) + component state, NO Redux
- **API Layer**: Two-tier service pattern: `api.js` (low-level) → `notesService.js` (business logic)
- **Styling**: TailwindCSS with utility-first approach

## Key Patterns & Conventions

### Service Layer Pattern
```javascript
// All API calls follow this pattern in services/
const result = await notesService.fetchNotes();
if (result.success) {
  // Handle success: result.data
} else {
  // Handle error: result.error
}
```

### Authentication & Storage
- **Token Storage**: `localStorage.getItem('notesapp_user')` contains `{token, user}` object
- **Auto-logout**: `handleAPIError()` in `api.js` auto-redirects on 401s
- **Offline Fallback**: Notes cached in `localStorage` as `notesapp_notes_cache`

### Component Organization
- **Screen Components**: Top-level views (`LoginScreen`, `NotesApp`)
- **Feature Components**: Domain-specific (`NoteCard`, `NoteEditor`, `AddNoteModal`)
- **Layout Components**: Navigation/structure (`NotesHeader`, `NotesList`)

### Error Handling Convention
```javascript
// Always return {success, data?, error?} from services
// UI components check result.success before proceeding
// Errors are user-friendly strings, not raw API responses
```

## Development Workflow

### Development Commands
```bash
npm run dev          # Start dev server (Vite HMR)
npm run build        # Production build
npm run preview      # Preview production build
```

### API Integration
- **Base URL**: Hardcoded Azure endpoint in `api.js`
- **Auth Headers**: Auto-injected via `getAuthHeaders()` helper
- **Error Types**: Network, 401 (redirect), generic (user message)

### Local Storage Keys
- `notesapp_user` - Authentication data
- `notesapp_notes_cache` - Offline notes backup

## Component Patterns

### Context Usage
```jsx
// Always use the custom hook, never useContext directly
const { isAuthenticated, login, logout } = useAuth();
```

### Modal Pattern
Components like `AddNoteModal` follow prop-based visibility:
```jsx
<AddNoteModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
```

### Loading States
Three-state pattern: `isLoading` → `error` → `success`
- Use `LoadingScreen` component for app-level loading
- Local loading states for operations

## File Extensions & Imports
- **Components**: `.jsx` extension required
- **Services**: `.js` extension, import with `.js` suffix
- **No TypeScript**: Plain JavaScript with prop validation via runtime checks

## Styling Approach
- **Primary**: TailwindCSS utility classes
- **Components**: No CSS modules, minimal custom CSS in `.css` files
- **Responsive**: Mobile-first Tailwind breakpoints

When adding features, follow the service→context→component data flow and maintain the consistent error handling pattern.