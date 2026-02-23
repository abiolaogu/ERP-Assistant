import React from "react";
import {
  Tabs,
  Descriptions,
  Card,
  Table,
  Tag,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Typography,
  Flex,
} from "antd";
import {
  PlayCircleOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import type { Agent, AgentRun } from "@/types/assistant.types";
import { formatDate, formatDuration, formatTokens, formatCurrency } from "@/utils/formatters";
import { AGENT_TYPE_COLORS } from "@/utils/constants";

const { Text } = Typography;

const mockAgent: Agent = {
  id: "a1",
  name: "Code Generator",
  description: "Generates production-ready TypeScript/React code from specifications. Supports component creation, API endpoints, and database models.",
  type: "coding",
  status: "idle",
  model: "gpt-4o",
  capabilities: ["typescript", "react", "node.js", "graphql"],
  createdAt: "2026-01-15T10:00:00Z",
  lastRunAt: "2026-02-23T10:15:00Z",
};

const mockRecentRuns: AgentRun[] = [
  { id: "r1", agentId: "a1", agentName: "Code Generator", status: "completed", trigger: "manual", input: "Implement user authentication module with JWT", output: "Generated 3 files: authService.ts, authMiddleware.ts, authTypes.ts", diffs: [], startedAt: "2026-02-23T10:15:00Z", completedAt: "2026-02-23T10:17:30Z", duration: 150, tokensUsed: 45200, cost: 0.18 },
  { id: "r2", agentId: "a1", agentName: "Code Generator", status: "completed", trigger: "manual", input: "Create payment processing service", output: "Generated 4 files with Stripe integration", diffs: [], startedAt: "2026-02-23T08:30:00Z", completedAt: "2026-02-23T08:33:10Z", duration: 190, tokensUsed: 62100, cost: 0.25 },
  { id: "r3", agentId: "a1", agentName: "Code Generator", status: "failed", trigger: "scheduled", input: "Generate GraphQL resolvers for inventory", diffs: [], startedAt: "2026-02-22T14:00:00Z", completedAt: "2026-02-22T14:01:10Z", duration: 70, tokensUsed: 8900, cost: 0.04 },
  { id: "r4", agentId: "a1", agentName: "Code Generator", status: "completed", trigger: "event", input: "Implement email notification service", output: "Generated email service with templates", diffs: [], startedAt: "2026-02-22T11:00:00Z", completedAt: "2026-02-22T11:03:00Z", duration: 180, tokensUsed: 51200, cost: 0.20 },
  { id: "r5", agentId: "a1", agentName: "Code Generator", status: "completed", trigger: "manual", input: "Create REST API for product catalog", output: "Generated 6 files with CRUD endpoints", diffs: [], startedAt: "2026-02-21T16:30:00Z", completedAt: "2026-02-21T16:34:00Z", duration: 210, tokensUsed: 72000, cost: 0.29 },
];

const mockLogs = [
  "[2026-02-23 10:15:00] Agent started - trigger: manual",
  "[2026-02-23 10:15:01] Parsing input: \"Implement user authentication module with JWT\"",
  "[2026-02-23 10:15:02] Analyzing project structure...",
  "[2026-02-23 10:15:05] Found existing patterns: Express middleware, TypeScript, JWT",
  "[2026-02-23 10:15:06] Generating authService.ts...",
  "[2026-02-23 10:15:45] Generating authMiddleware.ts...",
  "[2026-02-23 10:16:20] Generating authTypes.ts...",
  "[2026-02-23 10:16:50] Running validation checks...",
  "[2026-02-23 10:17:10] Type checking passed",
  "[2026-02-23 10:17:20] Creating diff entries...",
  "[2026-02-23 10:17:30] Agent completed - 3 files generated, 45.2K tokens used",
];

const AgentShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  void id;

  const totalRuns = mockRecentRuns.length;
  const totalTokens = mockRecentRuns.reduce((sum, r) => sum + r.tokensUsed, 0);
  const totalCost = mockRecentRuns.reduce((sum, r) => sum + r.cost, 0);
  const avgDuration = mockRecentRuns.reduce((sum, r) => sum + (r.duration || 0), 0) / totalRuns;

  const tabItems = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 10, textAlign: "center" }}>
                <Statistic
                  title="Total Runs"
                  value={totalRuns}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: "#0f6fa8", fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 10, textAlign: "center" }}>
                <Statistic
                  title="Avg Duration"
                  value={formatDuration(Math.round(avgDuration))}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 10, textAlign: "center" }}>
                <Statistic
                  title="Total Tokens"
                  value={formatTokens(totalTokens)}
                  valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 10, textAlign: "center" }}>
                <Statistic
                  title="Total Cost"
                  value={formatCurrency(totalCost)}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#722ed1", fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Agent Details" style={{ borderRadius: 10 }}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Name">{mockAgent.name}</Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={AGENT_TYPE_COLORS[mockAgent.type]} style={{ textTransform: "capitalize" }}>
                  {mockAgent.type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusBadge status={mockAgent.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                <Tag style={{ fontFamily: "monospace" }}>{mockAgent.model}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {mockAgent.description}
              </Descriptions.Item>
              <Descriptions.Item label="Capabilities" span={2}>
                <Flex wrap="wrap" gap={4}>
                  {mockAgent.capabilities.map((cap) => (
                    <Tag key={cap} style={{ borderRadius: 4 }}>{cap}</Tag>
                  ))}
                </Flex>
              </Descriptions.Item>
              <Descriptions.Item label="Created">{formatDate(mockAgent.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Last Run">{formatDate(mockAgent.lastRunAt)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ),
    },
    {
      key: "runs",
      label: "Recent Runs",
      children: (
        <Card style={{ borderRadius: 10 }}>
          <Table
            dataSource={mockRecentRuns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: "Input",
                dataIndex: "input",
                key: "input",
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
                render: (status: string) => <StatusBadge status={status} />,
              },
              {
                title: "Trigger",
                dataIndex: "trigger",
                key: "trigger",
                width: 100,
                render: (trigger: string) => (
                  <Tag style={{ textTransform: "capitalize", borderRadius: 4 }}>{trigger}</Tag>
                ),
              },
              {
                title: "Duration",
                dataIndex: "duration",
                key: "duration",
                width: 90,
                render: (val: number) => formatDuration(val),
              },
              {
                title: "Tokens",
                dataIndex: "tokensUsed",
                key: "tokensUsed",
                width: 80,
                render: (val: number) => formatTokens(val),
              },
              {
                title: "Cost",
                dataIndex: "cost",
                key: "cost",
                width: 80,
                render: (val: number) => formatCurrency(val),
              },
              {
                title: "Started",
                dataIndex: "startedAt",
                key: "startedAt",
                width: 140,
                render: (date: string) => formatDate(date, "MMM DD, HH:mm"),
              },
            ]}
          />
        </Card>
      ),
    },
    {
      key: "config",
      label: "Configuration",
      children: (
        <Card title="Agent Configuration" style={{ borderRadius: 10 }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="System Prompt">
              <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 12, margin: 0, whiteSpace: "pre-wrap" }}>
{`You are a senior TypeScript developer. Generate production-ready code following these guidelines:
- Use strict TypeScript with proper type annotations
- Follow functional programming patterns where appropriate
- Include comprehensive error handling
- Add JSDoc comments for all public functions
- Follow the project's existing coding patterns`}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="Model">{mockAgent.model}</Descriptions.Item>
            <Descriptions.Item label="Max Tokens">8192</Descriptions.Item>
            <Descriptions.Item label="Temperature">0.3</Descriptions.Item>
            <Descriptions.Item label="Auto-Approve">Disabled</Descriptions.Item>
            <Descriptions.Item label="Max Cost Per Run">$1.00</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: "logs",
      label: "Logs",
      children: (
        <Card title="Recent Logs" style={{ borderRadius: 10 }}>
          <div
            style={{
              background: "#1a1a2e",
              borderRadius: 8,
              padding: 16,
              maxHeight: 400,
              overflow: "auto",
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.8,
            }}
          >
            {mockLogs.map((log, index) => (
              <div
                key={index}
                style={{
                  color: log.includes("error") || log.includes("fail") ? "#ff4d4f"
                    : log.includes("completed") ? "#52c41a"
                    : "#d4d4d4",
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={mockAgent.name}
        subtitle={mockAgent.description}
        breadcrumbs={[
          { title: "Home", href: "/" },
          { title: "Agents", href: "/agents" },
          { title: mockAgent.name },
        ]}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/agents")}>
              Back
            </Button>
            <Button icon={<EditOutlined />}>Edit</Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              disabled={mockAgent.status === "running"}
            >
              Run Agent
            </Button>
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Space>
        }
      />

      <Tabs items={tabItems} defaultActiveKey="overview" size="large" />
    </div>
  );
};

export default AgentShow;
