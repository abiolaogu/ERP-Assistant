import React from "react";
import { Row, Col, Card, Table, Typography, Space, Progress, Flex } from "antd";
import {
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  LikeOutlined,
} from "@ant-design/icons";
import KPICard from "@/components/common/KPICard";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import type { AssistantMetrics, AgentRun, Agent } from "@/types/assistant.types";
import { formatDuration, formatTokens, formatCurrency, formatNumber } from "@/utils/formatters";

const { Text } = Typography;

const mockMetrics: AssistantMetrics = {
  totalAgents: 8,
  activeRuns: 3,
  completedToday: 47,
  avgRunDuration: 145,
  totalTokensToday: 2450000,
  approvalRate: 0.89,
};

const mockRunVolume = [
  { hour: "00:00", count: 2 },
  { hour: "04:00", count: 1 },
  { hour: "08:00", count: 8 },
  { hour: "12:00", count: 12 },
  { hour: "16:00", count: 15 },
  { hour: "20:00", count: 9 },
];

const mockAgentUtilization: { name: string; runs: number; tokens: number }[] = [
  { name: "Code Generator", runs: 18, tokens: 890000 },
  { name: "Code Reviewer", runs: 14, tokens: 520000 },
  { name: "Test Writer", runs: 9, tokens: 340000 },
  { name: "Doc Generator", runs: 6, tokens: 280000 },
];

const mockCostBreakdown = [
  { model: "GPT-4o", cost: 12.45, percentage: 45 },
  { model: "Claude 3.5", cost: 8.90, percentage: 32 },
  { model: "GPT-4o-mini", cost: 3.20, percentage: 12 },
  { model: "Other", cost: 3.05, percentage: 11 },
];

const mockRecentRuns: AgentRun[] = [
  { id: "r1", agentId: "a1", agentName: "Code Generator", status: "completed", trigger: "manual", input: "Implement user authentication module", output: "Generated 3 files", diffs: [], startedAt: "2026-02-23T10:15:00Z", completedAt: "2026-02-23T10:17:30Z", duration: 150, tokensUsed: 45200, cost: 0.18 },
  { id: "r2", agentId: "a2", agentName: "Code Reviewer", status: "running", trigger: "event", input: "Review PR #245", diffs: [], startedAt: "2026-02-23T10:20:00Z", tokensUsed: 12400, cost: 0.05, duration: 0 },
  { id: "r3", agentId: "a3", agentName: "Test Writer", status: "completed", trigger: "scheduled", input: "Generate unit tests for payment service", output: "Generated 5 test files", diffs: [], startedAt: "2026-02-23T09:45:00Z", completedAt: "2026-02-23T09:48:20Z", duration: 200, tokensUsed: 67800, cost: 0.27 },
  { id: "r4", agentId: "a1", agentName: "Code Generator", status: "failed", trigger: "manual", input: "Generate GraphQL resolvers", diffs: [], startedAt: "2026-02-23T09:30:00Z", completedAt: "2026-02-23T09:31:10Z", duration: 70, tokensUsed: 8900, cost: 0.04 },
];

const mockActiveAgents: Agent[] = [
  { id: "a1", name: "Code Generator", description: "Generates code from specs", type: "coding", status: "running", model: "gpt-4o", capabilities: ["typescript", "react", "node"], createdAt: "2026-01-15T10:00:00Z", lastRunAt: "2026-02-23T10:15:00Z" },
  { id: "a2", name: "Code Reviewer", description: "Reviews pull requests", type: "review", status: "running", model: "claude-3.5-sonnet", capabilities: ["code-review", "security", "performance"], createdAt: "2026-01-15T10:00:00Z", lastRunAt: "2026-02-23T10:20:00Z" },
  { id: "a3", name: "Test Writer", description: "Generates test cases", type: "testing", status: "idle", model: "gpt-4o", capabilities: ["jest", "vitest", "playwright"], createdAt: "2026-01-20T10:00:00Z", lastRunAt: "2026-02-23T09:45:00Z" },
];

const Dashboard: React.FC = () => {
  const maxRuns = Math.max(...mockRunVolume.map((d) => d.count));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="AI Assistant overview and activity"
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4}>
          <KPICard
            title="Active Agents"
            value={mockMetrics.totalAgents}
            prefix={<RobotOutlined />}
            trend={12.5}
            trendLabel="vs last week"
            borderColor="#0f6fa8"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <KPICard
            title="Running Jobs"
            value={mockMetrics.activeRuns}
            prefix={<ThunderboltOutlined />}
            borderColor="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <KPICard
            title="Completed Today"
            value={mockMetrics.completedToday}
            prefix={<CheckCircleOutlined />}
            trend={18.3}
            trendLabel="vs yesterday"
            borderColor="#0ea5a4"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <KPICard
            title="Avg Duration"
            value={formatDuration(mockMetrics.avgRunDuration)}
            prefix={<ClockCircleOutlined />}
            trend={-8.5}
            trendLabel="faster"
            borderColor="#722ed1"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <KPICard
            title="Tokens Today"
            value={formatTokens(mockMetrics.totalTokensToday)}
            prefix={<DollarOutlined />}
            trend={24.1}
            trendLabel="vs yesterday"
            borderColor="#fa8c16"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <KPICard
            title="Approval Rate"
            value={`${(mockMetrics.approvalRate * 100).toFixed(0)}%`}
            prefix={<LikeOutlined />}
            trend={3.2}
            trendLabel="vs last week"
            borderColor="#eb2f96"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title="Run Volume (Today)"
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <div style={{ height: 220 }}>
              <Flex align="flex-end" gap={12} style={{ height: "100%", paddingTop: 8 }}>
                {mockRunVolume.map((item) => {
                  const heightPercent = (item.count / maxRuns) * 100;
                  return (
                    <Flex
                      key={item.hour}
                      vertical
                      align="center"
                      justify="flex-end"
                      style={{ flex: 1, height: "100%" }}
                    >
                      <Text style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 4 }}>
                        {item.count}
                      </Text>
                      <div
                        style={{
                          width: "60%",
                          height: `${heightPercent}%`,
                          background: "linear-gradient(180deg, #0f6fa8 0%, #0ea5a4 100%)",
                          borderRadius: "6px 6px 0 0",
                          minHeight: 8,
                          transition: "height 0.3s ease",
                        }}
                      />
                      <Text style={{ fontSize: 11, color: "#8c8c8c", marginTop: 8 }}>
                        {item.hour}
                      </Text>
                    </Flex>
                  );
                })}
              </Flex>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="Agent Utilization"
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              {mockAgentUtilization.map((agent) => {
                const maxAgentRuns = Math.max(...mockAgentUtilization.map((a) => a.runs));
                return (
                  <div key={agent.name}>
                    <Flex justify="space-between" style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>{agent.name}</Text>
                      <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
                        {agent.runs} runs / {formatTokens(agent.tokens)} tokens
                      </Text>
                    </Flex>
                    <Progress
                      percent={(agent.runs / maxAgentRuns) * 100}
                      showInfo={false}
                      strokeColor={{ from: "#0f6fa8", to: "#0ea5a4" }}
                      size="small"
                    />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title="Cost Breakdown (Today)"
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size={14}>
              {mockCostBreakdown.map((item) => (
                <div key={item.model}>
                  <Flex justify="space-between" style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>{item.model}</Text>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: "#0f6fa8" }}>
                      {formatCurrency(item.cost)}
                    </Text>
                  </Flex>
                  <Progress
                    percent={item.percentage}
                    showInfo={false}
                    strokeColor="#0f6fa8"
                    size="small"
                  />
                </div>
              ))}
              <Flex justify="space-between" style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                <Text strong>Total</Text>
                <Text strong style={{ color: "#0f6fa8" }}>
                  {formatCurrency(mockCostBreakdown.reduce((sum, i) => sum + i.cost, 0))}
                </Text>
              </Flex>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Recent Runs"
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "12px 24px" }}
          >
            <Table
              dataSource={mockRecentRuns}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Agent",
                  dataIndex: "agentName",
                  key: "agentName",
                  render: (text: string) => (
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>{text}</Text>
                  ),
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (status: string) => <StatusBadge status={status} />,
                },
                {
                  title: "Tokens",
                  dataIndex: "tokensUsed",
                  key: "tokensUsed",
                  render: (val: number) => (
                    <Text style={{ fontSize: 12 }}>{formatTokens(val)}</Text>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Active Agents"
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "12px 24px" }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size={16}>
              {mockActiveAgents.map((agent) => (
                <Flex key={agent.id} justify="space-between" align="center">
                  <div>
                    <Text style={{ fontSize: 13, fontWeight: 500, display: "block" }}>
                      {agent.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
                      {agent.model} - {agent.type}
                    </Text>
                  </div>
                  <StatusBadge status={agent.status} />
                </Flex>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
