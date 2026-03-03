# Figma & Make.com Master Prompts -- Sovereign Assistant

**Module:** ERP-Assistant | **Port:** 5181 | **Version:** 2.0 | **Date:** 2026-03-03

---

## Inputs to Attach Before Prompting

1. **BRD.md** -- Business Requirements Document
2. **PRD.md** -- Product Requirements Document with all 43 functional requirements
3. **HLD.md** -- High-Level Design with component architecture
4. **Data-Architecture.md** -- Full ERD and data dictionary
5. **Brand Kit** -- Sovereign brand colors, typography, iconography

---

## Screen 1: Chat Interface (Primary Experience)

### Figma Prompt

```
Design the primary chat interface for Sovereign Assistant, an enterprise AI copilot.
This is where knowledge workers spend most of their time.

Layout (3-panel):

LEFT SIDEBAR (280px, collapsible):
- Logo: "Sovereign Assistant" with AI icon
- "New Conversation" button (prominent, primary color)
- Conversation history list:
  - Grouped by: Today, Yesterday, Last 7 Days, Older
  - Each item: title (auto-generated), timestamp, preview text
  - Active conversation highlighted
  - Right-click menu: Rename, Share, Archive, Delete
- Agent selector section:
  - Grid of available agents: "HR Assistant", "Sales Copilot", "Engineering Helper", "Finance Bot"
  - Each agent: icon, name, short description
  - "Default Assistant" is always first
- Bottom: user avatar, settings gear, usage stats link

CENTER PANEL (main, flexible width):
- Conversation thread:
  - User messages: right-aligned, blue bubble, avatar
  - Assistant messages: left-aligned, white/light bubble, AI avatar
  - Assistant messages include:
    - Markdown rendering (headings, bold, lists, code blocks, tables)
    - Inline citations: "[Source: HR Policy Guide, p.12]" as clickable chips
    - Charts/tables when data is returned (from NLQ)
    - Tool execution indicators: "Querying sales database..." with spinner
    - Confidence indicator: subtle icon for low-confidence answers
  - Streaming animation: cursor/typing indicator during generation
  - Message actions (on hover): Copy, Regenerate, Give Feedback (thumbs up/down), Share

- Input area (bottom):
  - Multi-line text input with placeholder: "Ask me anything about your organization..."
  - Attachment button: upload files (PDF, DOCX, images)
  - Voice input button: microphone icon
  - Agent indicator: shows which agent is active
  - Send button (or Enter to send, Shift+Enter for newline)
  - Character/token counter (subtle)
  - Suggested prompts: 3 contextual suggestions shown before first message
    - "Summarize the Q4 revenue report"
    - "What is our PTO policy?"
    - "Draft an email to the marketing team about the launch delay"

RIGHT PANEL (400px, collapsible, shown when citations exist):
- Citation details panel:
  - When user clicks a citation in the response
  - Shows: document title, section, page preview, relevance score
  - "Open full document" link
  - Related sections in the same document

Color scheme: Light theme default (white background, subtle gray panels, blue accents).
Dark mode toggle available. Clean, professional, Slack-like familiarity.
Typography: Inter for body, JetBrains Mono for code blocks.
Responsive: works on 1280px+ screens, tablet support.
```

---

## Screen 2: Knowledge Base Manager

### Figma Prompt

```
Design a knowledge base management interface for IT admins.

TOP BAR:
- Breadcrumb: Settings > Knowledge Bases
- "Create Knowledge Base" button (primary)
- Search knowledge bases

MAIN CONTENT (card grid or table toggle):
Card View (default):
- Each knowledge base as a card:
  - Name (large), description (truncated)
  - Stats: X documents, Y chunks, Z queries/day
  - Source icon: Google Drive, SharePoint, Confluence, Upload
  - Sync status: "Last synced: 2 hours ago" with green dot, or "Sync error" with red dot
  - Access badge: "Public" (green) or "Restricted" (yellow) with user count
  - Actions: Edit, Sync Now, Delete
  - Progress bar if currently syncing

CREATE/EDIT MODAL:
- Name and description fields
- Source type selector: Upload, Google Drive, SharePoint, Confluence, Notion, Slack
- Connection configuration (OAuth flow for external sources)
- Chunking settings: chunk size (256/512/1024 tokens), overlap (0/25/50 tokens)
- Access control:
  - Public (all users in tenant) or Restricted
  - User picker and group picker for restricted access
- Sync schedule: Manual, Hourly, Daily, Real-time

DOCUMENT LIST (when KB card is clicked):
- Table: Document name, Type, Size, Pages, Chunks, Last updated, Status
- Status: Processed (green), Processing (blue spinner), Error (red with retry)
- Upload button for adding new documents
- Drag-and-drop upload zone
- Bulk actions: Re-process, Delete, Move to another KB
```

---

## Screen 3: Document Viewer with AI Annotations

### Figma Prompt

```
Design a document viewer that shows AI-generated annotations alongside the original document.

SPLIT VIEW:
LEFT (60%): Document Preview
- Rendered document (PDF-like preview)
- Page navigation: page number selector, prev/next buttons
- Zoom controls: fit width, fit page, zoom slider
- Text selection: select text to ask questions about it
- Highlight mode: AI-detected key terms, dates, monetary values highlighted in different colors

RIGHT (40%): AI Panel
- Tab 1: Summary
  - Auto-generated document summary
  - Key points (bullet list)
  - Format selector: Brief | Standard | Detailed
  - "Copy summary" and "Share summary" buttons

- Tab 2: Extraction
  - Structured data extracted:
  - Key Dates: March 15 (deadline), April 1 (launch date)
  - Monetary Values: $2.5M budget, $1.8M spent
  - Named Entities: John Smith (approver), Acme Corp (vendor)
  - Action Items: 3 items extracted with owners
  - Export as JSON or CSV

- Tab 3: Q&A
  - Chat interface specific to this document
  - "Ask a question about this document..."
  - Previous Q&A history for this document
  - Answers cite specific pages/sections

- Tab 4: Compare
  - Upload or select a second document
  - Side-by-side diff view with semantic differences highlighted
  - Summary of changes: "12 sections modified, 3 new sections, 1 removed"

TOOLBAR:
- Download original
- Share (with AI summary attached)
- Print
- Add to Knowledge Base
```

---

## Screen 4: Meeting Recap Dashboard

### Figma Prompt

```
Design a meeting intelligence dashboard showing recent meetings with AI-generated recaps.

TOP ROW - Quick Stats:
- Meetings this week: 12
- Action items generated: 28
- Action items completed: 19 (68%)
- Average meeting duration: 34 min
- Time saved (estimated): 4.2 hours

MEETING LIST (main content, table or card view):
Each meeting card:
- Title, date/time, duration
- Participant avatars (3 shown + "+5 more")
- Source: Zoom/Teams/Meet icon
- AI Summary preview (2-3 lines)
- Action items count: "4 action items (2 complete, 1 overdue, 1 pending)"
- Tags: auto-generated topic tags
- "View Full Recap" button

FULL RECAP VIEW (when clicked, full-page overlay):
- Meeting title, date, participants list, duration
- Tabbed content:
  - Summary: AI-generated narrative summary with topic headers
  - Transcript: Full transcript with speaker labels, timestamps, search
  - Action Items: table with owner, description, due date, status, remind button
  - Decisions: list of decisions made with context
  - Key Topics: topic cards with time markers (click to jump to transcript position)

ACTION ITEM TRACKER (separate tab):
- Table of all action items across all meetings
- Filters: Owner, Status (open/done/overdue), Meeting, Date range
- Overdue items highlighted in red
- Bulk actions: Remind, Reassign, Mark Done
```

---

## Screen 5: Workflow Builder (Visual)

### Figma Prompt

```
Design a visual workflow builder for creating automated multi-step processes.

CANVAS (center, drag-and-drop):
- Visual flow chart style
- Nodes represent workflow steps:
  - Trigger node (green): "When someone says 'Submit expense report'" or "Every Monday at 9am"
  - Action nodes (blue): "Create Jira ticket", "Send Slack message", "Query database"
  - Decision nodes (yellow diamond): "If amount > $1000" with true/false branches
  - Approval nodes (orange): "Wait for manager approval"
  - End node (gray): "Send confirmation email"
- Connections: drag from node output to next node input
- Add node: "+" button between nodes opens panel of available actions
- Node configuration: click node to open settings sidebar

LEFT PANEL (node palette):
- Categories: Triggers, Actions, Logic, Integrations
- Drag-and-drop nodes onto canvas
- Search for specific actions

RIGHT PANEL (node configuration, appears on node click):
- Node name (editable)
- Action-specific settings:
  - For "Create Jira ticket": project, issue type, title template, description template
  - For "Send Slack message": channel, message template, mention users
  - For "Query database": natural language query or SQL
- Variable mapping: use outputs from previous steps as inputs
- Error handling: retry, skip, abort options

TOP BAR:
- Workflow name (editable)
- Status: Draft | Active | Paused
- Version history
- Test button (dry run with sample data)
- Activate/Deactivate toggle
- Save button
```

---

## Screen 6: Agent Builder

### Figma Prompt

```
Design an agent builder interface for creating custom AI agents.

LAYOUT (2-column):

LEFT (50%): Agent Configuration
- Agent name and description
- Department selector (HR, Sales, Engineering, Finance, Custom)
- Icon selector (emoji or upload)
- System prompt editor (large text area with markdown support)
  - Template starter: "You are a {department} assistant for {company}..."
  - Variable placeholders: {company_name}, {user_name}, {department}
  - Best practices tips shown alongside
- Knowledge base selector (multi-select with access preview)
- Model preference: Auto | Fast (7B) | Powerful (70B)

RIGHT (50%): Tools & Testing
- Available tools (drag-and-drop to enable):
  - Built-in: Search KB, Query Database, Send Email, Create Task, Notify Slack
  - Custom: "Add Custom Tool" button
  - Each tool card: name, description, approval required toggle
- Tool configuration (when selected): endpoint, parameters, permissions

BOTTOM: Live Testing Panel
- Chat interface for testing the agent before deployment
- Side-by-side with configuration: change prompt, see immediate effect
- "Clear conversation" button for fresh tests
- Sample queries to try

DEPLOYMENT:
- "Deploy Agent" button
- Access control: who can use this agent
- Analytics: usage stats, satisfaction scores, common queries
```

---

## Screen 7: Enterprise Search

### Figma Prompt

```
Design a unified enterprise search interface.

SEARCH BAR (top, prominent, Google-style):
- Large search input: "Search across all your company's knowledge..."
- Source filter pills: All | Documents | Slack | Jira | Email | Meetings | CRM | ERP
- Advanced filters: date range, author, file type, department

RESULTS:
- Grouped by source with source icon
- Each result:
  - Title (clickable)
  - Snippet with query terms highlighted (semantic, not just keyword)
  - Source badge: "Google Drive" | "Confluence" | "Slack #engineering" | "Jira ENG-1234"
  - Relevance score indicator (subtle dots or bar)
  - Timestamp: "Updated 3 days ago"
  - Preview on hover (document preview or Slack message context)
- "Ask AI about this" button on each result
- Infinite scroll or pagination
- "No results? Try asking the AI assistant" link at bottom

AI ANSWER PANEL (top of results, when relevant):
- If the query is a question, show AI-generated answer above results
- With citations to search results
- "Not what you're looking for? Try rephrasing or search specific sources"
```

---

## Screen 8: NLQ Playground

### Figma Prompt

```
Design a Natural Language Query playground for querying business data.

LAYOUT:
TOP: Query Input
- Large text input: "Ask a question about your data in plain English"
- Examples shown: "What were our top 10 customers by revenue last quarter?"
- Database selector: which connected database to query
- Submit button

RESULTS AREA (3-tab view):

Tab 1: Answer (default)
- Natural language answer with key numbers highlighted
- "Your top customer was Acme Corp with $2.4M in revenue, followed by..."
- Auto-generated chart visualization (bar, line, pie based on data shape)
- Chart controls: type selector, color scheme, download as PNG/SVG

Tab 2: Data Table
- Full result set as sortable, filterable table
- Column headers with data types
- Export: CSV, Excel, JSON
- Row count and query time

Tab 3: SQL Query
- Generated SQL with syntax highlighting
- "What I did" explanation in plain English
- "Edit and re-run" button for power users
- Copy SQL button

SIDEBAR: Query History
- Recent queries (clickable to re-run)
- Saved queries (star to save)
- "Share query" with link generation
```

---

## Make.com Automation Prompts

### Automation 1: Document Ingestion Pipeline
```
Create a Make.com scenario that:
1. Trigger: New file uploaded to Google Drive folder "Company Docs"
2. Check if file type is supported (PDF, DOCX, PPTX, MD)
3. Call Sovereign Assistant API to ingest document into knowledge base
4. Wait for processing completion (polling)
5. Slack notification: "New document indexed: {filename} - {chunk_count} chunks ready for querying"
```

### Automation 2: Meeting Follow-Up Automation
```
Create a Make.com scenario that:
1. Trigger: Zoom meeting ended webhook
2. Call Sovereign Assistant API to transcribe and summarize meeting
3. Create Slack post in #meeting-recaps with AI summary
4. For each action item extracted: create Jira ticket with owner assigned
5. Schedule reminder emails for action item due dates
```

### Automation 3: Weekly Knowledge Report
```
Create a Make.com scenario that:
1. Trigger: Every Monday at 8 AM
2. Query Sovereign Assistant analytics API for last week's usage
3. Generate report: top queries, knowledge gaps (unanswered queries), user adoption metrics
4. Format as HTML email
5. Send to IT admin and department leads
```

---

*Document Control: UI prompts iterated with design team feedback. Usability testing required per persona.*
