# Research Components

This directory contains the frontend components for the Hawaiian Research Assistant feature.

## Overview

The research system allows users to submit free-form questions about Hawaiian history and culture. An AI agent searches through Papa Kilo Database and Hawaiian language newspapers, providing real-time streaming updates of its activity and progressive results disclosure.

## Components

### ResearchQueryForm.tsx
Main input form for submitting research questions.

**Features:**
- Large textarea for free-form questions
- Character counter
- Example queries
- Submit button with loading states

**Usage:**
```tsx
import { ResearchQueryForm } from '@/components/research/ResearchQueryForm';

<ResearchQueryForm />
```

### ClarifyingQuestions.tsx
Dynamic form for answering agent's clarifying questions.

**Features:**
- Multiple question types (text, choice, multi-choice, date)
- Progress indicator
- Required/optional question handling
- Form validation

**Question Types:**
- `text` - Free-form text input
- `choice` - Single selection (radio buttons)
- `multi-choice` - Multiple selection (checkboxes)
- `date` - Date/time period input

**Usage:**
```tsx
import { ClarifyingQuestions } from '@/components/research/ClarifyingQuestions';

<ClarifyingQuestions />
```

### ActivityItem.tsx
Individual activity message display component.

**Features:**
- Type-specific icons and colors
- Metadata display
- Timestamp formatting
- Loading animation for latest item

**Activity Types:**
- `thinking` - Agent analyzing (gray)
- `searching` - Searching databases (blue)
- `reading` - Reading articles (purple)
- `found` - Found results (green)
- `analyzing` - Analyzing content (indigo)
- `result` - Progressive results (emerald)
- `error` - Error messages (red)

**Usage:**
```tsx
import { ActivityItem } from '@/components/research/ActivityItem';

<ActivityItem activity={activity} isLatest={true} />
```

### ResearchStream.tsx
Real-time activity stream display.

**Features:**
- Server-Sent Events (SSE) connection
- Auto-scrolling to latest activity
- Live status indicator
- Query display
- Completion/error messages

**Usage:**
```tsx
import { ResearchStream } from '@/components/research/ResearchStream';

<ResearchStream />
```

### ResearchResults.tsx
Final research results display.

**Features:**
- Summary with copy functionality
- Collapsible findings with confidence levels
- Source list with badges and links
- Related topics
- Source type color coding

**Source Types:**
- `papa-kilo` - Papa Kilo Database (blue)
- `newspaper` - Hawaiian newspapers (purple)
- `web` - Web sources (green)
- `other` - Other sources (gray)

**Usage:**
```tsx
import { ResearchResults } from '@/components/research/ResearchResults';

<ResearchResults />
```

## State Management

### ResearchContext
Central state management using React Context + useReducer.

**State:**
```typescript
{
  sessionId: string | null;
  status: 'idle' | 'clarifying' | 'researching' | 'complete' | 'error';
  query: string;
  clarifyingQuestions: ClarifyingQuestion[];
  answers: QuestionAnswer[];
  activityStream: ActivityMessage[];
  results: ResearchResult | null;
  error: string | null;
}
```

**Actions:**
- `INIT_RESEARCH` - Start new research session
- `SET_STATUS` - Update status
- `ADD_CLARIFYING_QUESTIONS` - Receive questions from agent
- `SUBMIT_ANSWERS` - Submit user answers
- `ADD_ACTIVITY` - Add single activity message
- `ADD_ACTIVITIES` - Add multiple activity messages
- `UPDATE_RESULTS` - Progressive result updates
- `SET_RESULTS` - Final complete results
- `SET_ERROR` - Error handling
- `RESET` - Reset to initial state

**Usage:**
```tsx
import { useResearch } from '@/hooks/contexts/ResearchContext';

const { state, dispatch, initiateResearch, submitAnswers, reset } = useResearch();
```

## Custom Hooks

### useResearchStream
Manages Server-Sent Events connection for real-time updates.

**Features:**
- Automatic connection management
- Event parsing and dispatch
- Error handling and reconnection
- Manual close function

**Usage:**
```tsx
import { useResearchStream } from '@/hooks/useResearchStream';

const { closeStream } = useResearchStream({
  sessionId: 'session_123',
  enabled: true
});
```

## Pages

### /research
Main research interface page.

**Features:**
- Query form (idle state)
- Clarifying questions (clarifying state)
- Activity stream (researching/complete state)
- Results display (complete state)
- Error handling
- New research button

### /research/history
Research history page showing past sessions.

**Features:**
- List of past research sessions
- Status badges
- Session summaries
- View/delete actions
- Empty state with CTA

## API Endpoints

### POST /api/research/initiate
Initiate a new research session.

**Request:**
```json
{
  "query": "What were traditional methods...?"
}
```

**Response:**
```json
{
  "sessionId": "session_123",
  "clarifyingQuestions": [...] // Optional
}
```

### POST /api/research/clarify
Submit answers to clarifying questions.

**Request:**
```json
{
  "sessionId": "session_123",
  "answers": [
    {
      "questionId": "q1",
      "answer": "1800s"
    }
  ]
}
```

### GET /api/research/stream/[sessionId]
Server-Sent Events stream for real-time updates.

**Event Types:**
- `activity` - New activity message
- `result` - Progressive or final results
- `complete` - Research complete
- `error` - Error occurred
- `questions` - Additional clarifying questions

### GET /api/research/history
Fetch user's research history.

**Response:**
```json
{
  "sessions": [...]
}
```

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui components for consistency
- Dark mode support
- Responsive design
- Smooth animations and transitions

## Color Palette

**Activity Types:**
- Thinking: Gray (`text-gray-600`)
- Searching: Blue (`text-blue-600`)
- Reading: Purple (`text-purple-600`)
- Found: Green (`text-green-600`)
- Analyzing: Indigo (`text-indigo-600`)
- Result: Emerald (`text-emerald-600`)
- Error: Red (`text-red-600`)

**Source Types:**
- Papa Kilo: Blue background
- Newspaper: Purple background
- Web: Green background
- Other: Gray background

## Future Enhancements

- [ ] Export results to PDF/markdown
- [ ] Share research sessions
- [ ] Bookmark/favorite findings
- [ ] Real-time collaboration
- [ ] Advanced search filters
- [ ] Mobile-optimized layout
- [ ] Keyboard shortcuts
- [ ] Voice input for queries
- [ ] Citation formatting (MLA, APA, Chicago)
- [ ] Integration with reference managers

## TypeScript Types

All types are defined in `@/types/research.ts`. Key types include:

- `ResearchStatus` - Current research state
- `ActivityType` - Type of activity message
- `ActivityMessage` - Single activity update
- `ClarifyingQuestion` - Agent question structure
- `ResearchResult` - Final results structure
- `ResearchSession` - Complete session data
- `StreamEvent` - SSE event format
