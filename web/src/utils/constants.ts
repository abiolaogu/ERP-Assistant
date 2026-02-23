export const APP_NAME = "ERP-Assistant Platform";

export const STATUS_COLORS: Record<string, string> = {
  // Agent statuses
  idle: "default",
  running: "processing",
  paused: "warning",
  error: "error",

  // Run statuses
  queued: "default",
  completed: "success",
  failed: "error",
  cancelled: "warning",

  // Diff statuses
  pending: "processing",
  approved: "success",
  rejected: "error",

  // Change types
  added: "green",
  modified: "blue",
  deleted: "red",
};

export const DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const CURRENCY = "USD";

export const AGENT_TYPE_COLORS: Record<string, string> = {
  coding: "blue",
  review: "purple",
  testing: "green",
  documentation: "orange",
};

export const TRIGGER_COLORS: Record<string, string> = {
  manual: "default",
  scheduled: "blue",
  event: "purple",
};

export const APPROVAL_TYPE_COLORS: Record<string, string> = {
  code_change: "blue",
  deployment: "red",
  config_change: "orange",
};
