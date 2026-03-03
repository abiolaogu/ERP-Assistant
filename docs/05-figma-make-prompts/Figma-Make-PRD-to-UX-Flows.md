# Figma Make Prompts: PRD to UX Flows -- Sovereign Assistant

**Module:** ERP-Assistant | **Port:** 5181 | **Version:** 3.0 | **Date:** 2026-03-03

---

## Objective

Translate the Sovereign Assistant PRD feature requirements into deterministic UX flows with complete state coverage for all user interfaces: chat interface, agent task panel, knowledge base editor, search results, and settings.

## 1. Chat Interface -- Main Conversation View

### 1.1 Message Bubbles

**Figma Prompt:**
```
Design a conversational chat interface for an enterprise AI assistant. The chat area occupies 70% of the screen width, centered. Left sidebar (15%) shows conversation history list. Right sidebar (15%) shows context panel (citations, related queries).

User messages: Right-aligned, blue background (#1677FF), white text, rounded corners (12px), max-width 70% of chat area. Show user avatar (32px circle) and timestamp.

Assistant messages: Left-aligned, white background (#FFFFFF) with 1px border (#E8E8E8), dark text (#262626), rounded corners (12px), max-width 80% of chat area. Show assistant avatar (robot icon, 32px circle, purple gradient).

Message types:
1. Text response: Markdown-rendered content with inline code, tables, and lists
2. Data table: Ant Design Table component embedded in message bubble, sortable columns, with "Export to CSV" button
3. Chart: Embedded Ant Design Charts (bar, line, pie) with hover tooltips
4. Citation card: Small card below data points showing source module, entity, and timestamp. Clickable to view source.
5. Document card: File preview card with document icon, name, format badge (PDF/DOCX), file size, and "Download" button
6. Tool use card: Collapsible card showing tool name, status (spinner/checkmark), input parameters (collapsed by default), and result preview
7. Agent progress card: Multi-step progress indicator showing each step with status icon (pending/running/complete/failed), step description, and elapsed time
8. Error message: Red border (#FF4D4F), warning icon, error description, "Try again" button

Input area: Fixed at bottom. Full-width text input with rounded corners, placeholder "Ask anything about your business...", microphone icon (voice input), paperclip icon (file upload), send button (arrow icon). Supports multi-line (shift+enter for newline). Character count shown when >500 chars. Shows typing indicator when assistant is generating.

Streaming animation: Assistant messages appear token-by-token with a blinking cursor at the end during generation. Tool use cards appear inline during streaming.
```

### 1.2 Conversation History Sidebar

**Figma Prompt:**
```
Design a left sidebar (280px wide) for conversation history. Background: #FAFAFA.

Top section: "New Chat" button (primary, full-width) with plus icon.

Search bar: Full-width search input with magnifying glass icon. Filters conversations by title and content.

Conversation list: Grouped by date (Today, Yesterday, Last 7 Days, Older).
Each conversation item:
- Title (auto-generated from first message, 1 line, ellipsis overflow)
- Preview text (last message, 1 line, gray #8C8C8C)
- Timestamp (relative: "2h ago", "Yesterday")
- Three-dot menu (on hover): Rename, Archive, Delete

Active conversation: Blue left border (3px), light blue background (#E6F4FF).

Collapsed state (mobile/narrow): Icon-only sidebar (48px) with conversation avatars.
```

### 1.3 Context Panel (Right Sidebar)

**Figma Prompt:**
```
Design a right sidebar (320px wide) that shows contextual information for the current conversation.

Tabs: Citations | Related | Modules

Citations tab:
- List of all data citations from the conversation
- Each citation: Module icon, entity name, value, timestamp
- Click to navigate to source module

Related tab:
- "People also ask" style suggestions based on current conversation
- Each suggestion is a clickable pill that sends the query

Modules tab:
- List of modules accessed in this conversation
- Each module: Icon, name, number of queries made
- Status indicator (green dot = healthy, red = unavailable)

Collapsible: Toggle button to hide/show right sidebar.
```

## 2. Tool Use Cards

**Figma Prompt:**
```
Design inline tool use cards that appear within assistant messages when the assistant calls ERP module APIs.

Card layout: Full-width within message bubble, 1px border (#D9D9D9), rounded corners (8px), background #FAFAFA.

Header: Tool icon (module-specific) + tool name ("Querying Finance Module") + status badge.
Status badges:
- Running: Blue spinner + "Processing..."
- Complete: Green checkmark + "Done"
- Failed: Red X + "Failed" + retry link

Body (collapsed by default, expandable):
- Input: JSON-formatted parameters in monospace font, syntax-highlighted
- Output: Formatted result (table for data, text for messages)
- Timing: "Completed in 340ms"

Multiple tool calls: Stack vertically with 8px gap. Show parallel calls side-by-side on desktop.
```

## 3. Agent Task Panel

**Figma Prompt:**
```
Design a full-screen overlay panel (modal) for AI agent task execution.

Header: Agent name + icon, task description, status badge (Planning/Executing/Awaiting Approval/Complete).

Progress section:
- Vertical stepper (Ant Design Steps component, vertical layout)
- Each step: Number, description, status icon, elapsed time
- Current step: Highlighted with blue border, spinning indicator
- Completed steps: Green checkmark, show brief result summary
- Failed steps: Red X, show error message, "Retry" button

Approval section (when required):
- Card with summary of action to be approved
- Details table (line items, amounts, entities affected)
- "Approve" (green) and "Reject" (red) buttons
- "Edit" button to modify before approving

Results section:
- Summary card with outcome description
- Generated documents (download links)
- Tasks created (linked to ERP modules)
- "View Details" expandable section for full execution log

Footer: "Close" button, "Run Again" button, "Report Issue" link.
```

## 4. Knowledge Base Editor

**Figma Prompt:**
```
Design a knowledge base management interface for admin users.

Layout: Three-column layout.
- Left column (240px): Category tree (collapsible, drag-to-reorder)
- Center column (flex): Article list (search + filters + table)
- Right column (400px): Article editor/preview

Article list:
- Search bar with category, status, and author filters
- Table columns: Title, Category, Status (Published/Draft/Archived badge), Author, Updated, Views, Helpful count
- Bulk actions: Publish, Archive, Delete

Article editor:
- Rich text editor (Markdown with live preview toggle)
- Title input (large, bold)
- Category selector (dropdown)
- Tags input (multi-select with autocomplete)
- Status toggle (Draft/Published)
- "Auto-generate from conversation" button (creates article from resolved support conversation)
- Source information (if auto-generated: conversation link, date)

Upload section:
- Drag-and-drop zone for PDF, DOCX, XLSX files
- Shows processing status: "Parsing... → Chunking... → Embedding... → Complete"
- Preview of extracted text with chunk boundaries shown
```

## 5. Enterprise Search Results

**Figma Prompt:**
```
Design a search results page for cross-module enterprise search.

Search header: Large search input (centered, 60% width), with module filter chips below (All, Finance, HR, Inventory, Knowledge Base, etc.). Active filters shown as blue chips.

Results layout: Card-based results, full-width, 12px gap between cards.

Result card:
- Module icon + module name (tag/badge)
- Title (linked, clickable)
- Snippet (highlighted matching text, 2-3 lines)
- Metadata row: Entity type, last updated, relevance score bar
- Action buttons: "Open in Module", "Ask about this"

Faceted filters (left sidebar, 240px):
- Module (checkbox list with counts)
- Date range (date picker)
- Entity type (checkbox list)
- Author/Owner (searchable dropdown)

Pagination: "Load more" button (not page numbers) for infinite scroll feel.
Empty state: Illustration + "No results found. Try different keywords or ask the assistant directly."

AI summary: At the top of results, a collapsible card with AI-generated summary answering the search query, with citations to the results below.
```

## 6. Settings and Preferences

**Figma Prompt:**
```
Design a settings page for the AI assistant with tabbed navigation.

Tabs: General | Notifications | Privacy | Agents | Admin

General tab:
- Language preference (dropdown)
- Response format preference (Concise/Detailed toggle)
- Default modules (multi-select: which modules to search by default)
- Theme (Light/Dark/System)
- Keyboard shortcuts reference

Notifications tab:
- Agent task completion (toggle + channel: email/slack/in-app)
- Scheduled report delivery (toggle + frequency)
- Knowledge base updates (toggle)
- System announcements (toggle)

Privacy tab:
- Conversation history retention (dropdown: 30/90/180/365 days)
- "Delete all my conversation history" button (with confirmation modal)
- Data export ("Download my data" button, GDPR compliance)
- Analytics opt-out toggle

Agents tab:
- List of available agents with enable/disable toggle
- Per-agent configuration: approval thresholds, allowed modules
- "Create Custom Agent" button (admin only)

Admin tab (admin users only):
- Usage dashboard: queries/day chart, active users, top modules, cost tracking
- User management: role assignment, module access
- Knowledge base settings: auto-generation rules, approval workflow
- LLM configuration: model selection, token budgets, rate limits
- Audit log viewer: searchable, filterable activity log
```

## 7. Mobile Responsive States

**Figma Prompt:**
```
Design mobile-responsive versions of the chat interface (breakpoint: 768px).

Mobile layout:
- Full-screen chat (no sidebars)
- Bottom navigation: Chat, Search, Agents, Settings (4 icons)
- Conversation history: Slide-in drawer from left (swipe gesture)
- Context panel: Slide-in drawer from right
- Input area: Fixed at bottom, adapts to keyboard
- Voice button prominently placed (larger on mobile for hands-free use)

Tablet layout (768px-1024px):
- Two-column: conversation history sidebar + chat area
- Right sidebar hidden, accessible via toggle button
- Agent task panel: Bottom sheet instead of modal

States to design:
1. Empty state (no conversations)
2. Loading state (skeleton screens for messages)
3. Streaming state (tokens appearing, typing indicator)
4. Error state (network error, LLM timeout, module unavailable)
5. Offline state (cached conversations viewable, new queries disabled)
```

## 8. Interaction Patterns

### 8.1 Query Autocomplete

**Figma Prompt:**
```
Design an autocomplete dropdown for the chat input field.

Trigger: Appears after 2+ characters typed, with 300ms debounce.

Sections in dropdown:
1. "Recent queries" (last 5 matching queries from this user)
2. "Suggested queries" (popular queries matching the prefix)
3. "Quick actions" (matching agent tasks: "Process expense report", "Submit PTO")

Each item: Icon (clock for recent, sparkle for suggested, robot for agents) + query text + module badge.

Keyboard navigation: Arrow keys to select, Enter to submit, Escape to dismiss.
```

### 8.2 Feedback Mechanism

**Figma Prompt:**
```
Design a feedback mechanism for assistant responses.

Below each assistant message: Thumbs up and thumbs down icons (gray, 16px).

On thumbs down click: Slide-down panel with:
- Checkbox options: "Inaccurate data", "Wrong module", "Too slow", "Unhelpful", "Other"
- Optional text input: "Tell us more..."
- "Submit" button

On thumbs up click: Brief "Thank you!" toast notification.

Feedback data used to improve intent classification and response quality.
```

---

*Confidential. Sovereign Assistant. All rights reserved.*
