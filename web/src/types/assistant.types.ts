export interface Agent {
  id: string;
  name: string;
  description: string;
  type: "coding" | "review" | "testing" | "documentation";
  status: "idle" | "running" | "paused" | "error";
  model: string;
  capabilities: string[];
  createdAt: string;
  lastRunAt?: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  agentName: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  trigger: "manual" | "scheduled" | "event";
  input: string;
  output?: string;
  diffs: DiffEntry[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
  tokensUsed: number;
  cost: number;
}

export interface DiffEntry {
  id: string;
  runId: string;
  filePath: string;
  changeType: "added" | "modified" | "deleted";
  additions: number;
  deletions: number;
  patch: string;
  status: "pending" | "approved" | "rejected";
}

export interface Approval {
  id: string;
  runId: string;
  agentName: string;
  requestedBy: string;
  type: "code_change" | "deployment" | "config_change";
  status: "pending" | "approved" | "rejected";
  description: string;
  diffCount: number;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AssistantMetrics {
  totalAgents: number;
  activeRuns: number;
  completedToday: number;
  avgRunDuration: number;
  totalTokensToday: number;
  approvalRate: number;
}
