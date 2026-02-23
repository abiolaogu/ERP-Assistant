import React from "react";
import { Table, Button, Tag, Space, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import type { AgentRun } from "@/types/assistant.types";
import { formatDate, formatDuration, formatTokens, formatCurrency } from "@/utils/formatters";
import { TRIGGER_COLORS } from "@/utils/constants";

const { Text } = Typography;

const mockRuns: AgentRun[] = [
  { id: "r1", agentId: "a1", agentName: "Code Generator", status: "completed", trigger: "manual", input: "Implement user authentication module with JWT", output: "Generated 3 files", diffs: [{ id: "d1", runId: "r1", filePath: "src/auth/authService.ts", changeType: "added", additions: 85, deletions: 0, patch: "", status: "approved" }, { id: "d2", runId: "r1", filePath: "src/auth/authMiddleware.ts", changeType: "added", additions: 42, deletions: 0, patch: "", status: "pending" }], startedAt: "2026-02-23T10:15:00Z", completedAt: "2026-02-23T10:17:30Z", duration: 150, tokensUsed: 45200, cost: 0.18 },
  { id: "r2", agentId: "a2", agentName: "Code Reviewer", status: "running", trigger: "event", input: "Review PR #245 - Payment service refactor", diffs: [], startedAt: "2026-02-23T10:20:00Z", tokensUsed: 12400, cost: 0.05, duration: 0 },
  { id: "r3", agentId: "a3", agentName: "Test Writer", status: "completed", trigger: "scheduled", input: "Generate unit tests for payment service", output: "Generated 5 test files", diffs: [{ id: "d3", runId: "r3", filePath: "tests/payment.test.ts", changeType: "added", additions: 120, deletions: 0, patch: "", status: "pending" }], startedAt: "2026-02-23T09:45:00Z", completedAt: "2026-02-23T09:48:20Z", duration: 200, tokensUsed: 67800, cost: 0.27 },
  { id: "r4", agentId: "a1", agentName: "Code Generator", status: "failed", trigger: "manual", input: "Generate GraphQL resolvers for inventory", diffs: [], startedAt: "2026-02-23T09:30:00Z", completedAt: "2026-02-23T09:31:10Z", duration: 70, tokensUsed: 8900, cost: 0.04 },
  { id: "r5", agentId: "a4", agentName: "Documentation Generator", status: "completed", trigger: "manual", input: "Generate API documentation for v2 endpoints", output: "Generated docs for 12 endpoints", diffs: [{ id: "d4", runId: "r5", filePath: "docs/api-v2.md", changeType: "added", additions: 340, deletions: 0, patch: "", status: "approved" }], startedAt: "2026-02-23T08:00:00Z", completedAt: "2026-02-23T08:04:30Z", duration: 270, tokensUsed: 89000, cost: 0.36 },
  { id: "r6", agentId: "a5", agentName: "Bug Fixer", status: "completed", trigger: "event", input: "Fix: TypeError in OrderService.calculateTotal()", output: "Fixed null check in calculateTotal", diffs: [{ id: "d5", runId: "r6", filePath: "src/services/OrderService.ts", changeType: "modified", additions: 5, deletions: 2, patch: "", status: "approved" }], startedAt: "2026-02-22T16:00:00Z", completedAt: "2026-02-22T16:01:30Z", duration: 90, tokensUsed: 15600, cost: 0.06 },
  { id: "r7", agentId: "a2", agentName: "Code Reviewer", status: "completed", trigger: "event", input: "Review PR #242 - Database migration scripts", output: "Found 2 issues: missing index, unsafe migration", diffs: [], startedAt: "2026-02-22T14:00:00Z", completedAt: "2026-02-22T14:02:10Z", duration: 130, tokensUsed: 34500, cost: 0.14 },
  { id: "r8", agentId: "a6", agentName: "Security Scanner", status: "failed", trigger: "scheduled", input: "Full security scan of main branch", diffs: [], startedAt: "2026-02-22T08:00:00Z", completedAt: "2026-02-22T08:00:45Z", duration: 45, tokensUsed: 5200, cost: 0.02 },
];

const RunList: React.FC = () => {
  const navigate = useNavigate();

  const columns: ColumnsType<AgentRun> = [
    {
      title: "Agent",
      dataIndex: "agentName",
      key: "agentName",
      width: 180,
      render: (text: string, record: AgentRun) => (
        <a onClick={() => navigate(`/runs/${record.id}`)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
    },
    {
      title: "Input",
      dataIndex: "input",
      key: "input",
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ fontSize: 13 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      filters: [
        { text: "Queued", value: "queued" },
        { text: "Running", value: "running" },
        { text: "Completed", value: "completed" },
        { text: "Failed", value: "failed" },
        { text: "Cancelled", value: "cancelled" },
      ],
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: "Trigger",
      dataIndex: "trigger",
      key: "trigger",
      width: 100,
      render: (trigger: string) => (
        <Tag
          color={TRIGGER_COLORS[trigger]}
          style={{ textTransform: "capitalize", borderRadius: 4 }}
        >
          {trigger}
        </Tag>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      width: 90,
      sorter: true,
      render: (val: number) => formatDuration(val),
    },
    {
      title: "Tokens",
      dataIndex: "tokensUsed",
      key: "tokensUsed",
      width: 80,
      sorter: true,
      render: (val: number) => formatTokens(val),
    },
    {
      title: "Cost",
      dataIndex: "cost",
      key: "cost",
      width: 80,
      sorter: true,
      render: (val: number) => formatCurrency(val),
    },
    {
      title: "Diffs",
      key: "diffs",
      width: 60,
      render: (_: unknown, record: AgentRun) => (
        <Text style={{ fontWeight: 500 }}>{record.diffs.length}</Text>
      ),
    },
    {
      title: "Started",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 140,
      sorter: true,
      defaultSortOrder: "descend",
      render: (date: string) => formatDate(date, "MMM DD, HH:mm"),
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_: unknown, record: AgentRun) => (
        <Tooltip title="View">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/runs/${record.id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Agent Runs"
        subtitle="Track all agent execution history"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Agent Runs" }]}
      />

      <Table
        dataSource={mockRuns}
        columns={columns}
        rowKey="id"
        pagination={{
          total: mockRuns.length,
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `${total} runs`,
        }}
        style={{ background: "#fff", borderRadius: 10 }}
      />
    </div>
  );
};

export default RunList;
