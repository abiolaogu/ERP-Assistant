import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Typography,
  Tag,
  Space,
  Flex,
  Progress,
  Select,
  Statistic,
  Divider,
  Avatar,
} from "antd";
import {
  MessageOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RobotOutlined,
  RiseOutlined,
  TeamOutlined,
  FundOutlined,
  PieChartOutlined,
  BarChartOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/common/KPICard";
import { formatDate, formatNumber, formatTokens, formatCurrency } from "@/utils/formatters";

const { Text, Paragraph } = Typography;

const mockDailyUsage = [
  { date: "Feb 22", messages: 245, tokens: 1820000, cost: 18.50 },
  { date: "Feb 23", messages: 312, tokens: 2340000, cost: 23.80 },
  { date: "Feb 24", messages: 189, tokens: 1420000, cost: 14.40 },
  { date: "Feb 25", messages: 278, tokens: 2080000, cost: 21.20 },
  { date: "Feb 26", messages: 356, tokens: 2670000, cost: 27.10 },
  { date: "Feb 27", messages: 298, tokens: 2230000, cost: 22.70 },
  { date: "Feb 28", messages: 210, tokens: 1580000, cost: 16.10 },
];

const modelUsage = [
  { model: "Claude 3.5 Sonnet", tokens: 4250000, cost: 42.50, percentage: 38, color: "#722ed1" },
  { model: "GPT-4o", tokens: 3180000, cost: 38.16, percentage: 28, color: "#0f6fa8" },
  { model: "GPT-4o Mini", tokens: 2120000, cost: 4.24, percentage: 19, color: "#52c41a" },
  { model: "Gemini Pro", tokens: 1080000, cost: 5.40, percentage: 10, color: "#fa8c16" },
  { model: "Claude 3 Opus", tokens: 560000, cost: 16.80, percentage: 5, color: "#eb2f96" },
];

const agentUsage = [
  { agent: "Customer Support Agent", messages: 520, tokens: 3900000, cost: 39.00, avgResponseTime: 1.2 },
  { agent: "Code Review Agent", messages: 340, tokens: 2550000, cost: 30.60, avgResponseTime: 2.8 },
  { agent: "Data Analysis Agent", messages: 280, tokens: 2100000, cost: 21.00, avgResponseTime: 3.4 },
  { agent: "Content Writer Agent", messages: 210, tokens: 1575000, cost: 15.75, avgResponseTime: 4.1 },
  { agent: "Meeting Summarizer", messages: 190, tokens: 1425000, cost: 7.13, avgResponseTime: 1.8 },
  { agent: "Onboarding Assistant", messages: 148, tokens: 592000, cost: 5.92, avgResponseTime: 0.9 },
];

const topUsers = [
  { user: "Sarah Johnson", department: "Engineering", messages: 145, tokens: 1087500, cost: 10.88, lastActive: "2026-02-28T10:15:00Z" },
  { user: "Michael Chen", department: "Engineering", messages: 128, tokens: 960000, cost: 9.60, lastActive: "2026-02-28T09:45:00Z" },
  { user: "Emily Rodriguez", department: "Product", messages: 112, tokens: 840000, cost: 8.40, lastActive: "2026-02-28T10:00:00Z" },
  { user: "David Kim", department: "Data Science", messages: 98, tokens: 735000, cost: 7.35, lastActive: "2026-02-27T16:20:00Z" },
  { user: "Lisa Wang", department: "Engineering", messages: 87, tokens: 652500, cost: 6.53, lastActive: "2026-02-27T14:10:00Z" },
  { user: "James Taylor", department: "Support", messages: 76, tokens: 570000, cost: 5.70, lastActive: "2026-02-27T11:00:00Z" },
  { user: "Ana Martinez", department: "Marketing", messages: 65, tokens: 487500, cost: 4.88, lastActive: "2026-02-27T09:30:00Z" },
  { user: "Robert Brown", department: "Operations", messages: 54, tokens: 405000, cost: 4.05, lastActive: "2026-02-26T15:00:00Z" },
];

const teamBudgets = [
  { team: "Engineering", allocated: 200, used: 158.40, members: 12 },
  { team: "Product", allocated: 100, used: 72.30, members: 5 },
  { team: "Data Science", allocated: 150, used: 98.50, members: 4 },
  { team: "Support", allocated: 80, used: 45.20, members: 8 },
  { team: "Marketing", allocated: 60, used: 32.80, members: 3 },
  { team: "Operations", allocated: 40, used: 18.90, members: 2 },
];

const costProjections = [
  { month: "Mar 2026", projected: 580, trend: "up" },
  { month: "Apr 2026", projected: 615, trend: "up" },
  { month: "May 2026", projected: 650, trend: "up" },
];

const UsageAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState("7d");

  const totalConversations = mockDailyUsage.reduce((s, d) => s + d.messages, 0);
  const totalTokens = mockDailyUsage.reduce((s, d) => s + d.tokens, 0);
  const totalCost = mockDailyUsage.reduce((s, d) => s + d.cost, 0);
  const avgResponseTime = agentUsage.reduce((s, a) => s + a.avgResponseTime, 0) / agentUsage.length;
  const maxDailyMessages = Math.max(...mockDailyUsage.map((d) => d.messages));
  const maxAgentMessages = Math.max(...agentUsage.map((a) => a.messages));

  const userColumns = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: (user: string, record: typeof topUsers[0]) => (
        <Flex gap={8} align="center">
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#0f6fa8" }} />
          <div>
            <Text style={{ fontSize: 13, fontWeight: 500, display: "block" }}>{user}</Text>
            <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{record.department}</Text>
          </div>
        </Flex>
      ),
    },
    {
      title: "Messages",
      dataIndex: "messages",
      key: "messages",
      width: 90,
      sorter: (a: typeof topUsers[0], b: typeof topUsers[0]) => a.messages - b.messages,
      render: (v: number) => <Text style={{ fontSize: 13, fontWeight: 600 }}>{v}</Text>,
    },
    {
      title: "Tokens",
      dataIndex: "tokens",
      key: "tokens",
      width: 90,
      render: (v: number) => <Text style={{ fontSize: 12, fontFamily: "monospace" }}>{formatTokens(v)}</Text>,
    },
    {
      title: "Cost",
      dataIndex: "cost",
      key: "cost",
      width: 80,
      sorter: (a: typeof topUsers[0], b: typeof topUsers[0]) => a.cost - b.cost,
      render: (v: number) => <Text style={{ fontSize: 12, fontWeight: 600, color: "#0f6fa8" }}>{formatCurrency(v)}</Text>,
    },
    {
      title: "Last Active",
      dataIndex: "lastActive",
      key: "lastActive",
      width: 130,
      render: (date: string) => <Text style={{ fontSize: 12 }}>{formatDate(date, "MMM DD, HH:mm")}</Text>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Usage Analytics"
        subtitle="Monitor AI assistant usage, costs, and performance metrics"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Analytics" }]}
        extra={
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 140 }} options={[
            { value: "7d", label: "Last 7 Days" },
            { value: "30d", label: "Last 30 Days" },
            { value: "90d", label: "Last 90 Days" },
          ]} />
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={5}>
          <KPICard title="Conversations" value={formatNumber(totalConversations)} prefix={<MessageOutlined />} trend={14.2} trendLabel="vs prev period" borderColor="#0f6fa8" />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <KPICard title="Total Messages" value={formatNumber(totalConversations * 2.4)} prefix={<ThunderboltOutlined />} trend={18.7} trendLabel="vs prev period" borderColor="#52c41a" />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <KPICard title="Tokens Used" value={formatTokens(totalTokens)} prefix={<FundOutlined />} trend={22.3} trendLabel="vs prev period" borderColor="#fa8c16" />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <KPICard title="Avg Response" value={`${avgResponseTime.toFixed(1)}s`} prefix={<ClockCircleOutlined />} trend={-12.5} trendLabel="faster" borderColor="#722ed1" />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <KPICard title="Total Cost" value={formatCurrency(totalCost)} prefix={<DollarOutlined />} trend={8.1} trendLabel="vs prev period" borderColor="#eb2f96" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Usage Trends" style={{ borderRadius: 10 }} bodyStyle={{ padding: "16px 24px" }}>
            <div style={{ height: 200 }}>
              <Flex align="flex-end" gap={12} style={{ height: "100%", paddingTop: 8 }}>
                {mockDailyUsage.map((item) => {
                  const heightPercent = (item.messages / maxDailyMessages) * 100;
                  return (
                    <Flex key={item.date} vertical align="center" justify="flex-end" style={{ flex: 1, height: "100%" }}>
                      <Text style={{ fontSize: 10, color: "#0f6fa8", fontWeight: 600, marginBottom: 2 }}>
                        {formatCurrency(item.cost)}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#8c8c8c", marginBottom: 4 }}>{item.messages}</Text>
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
                      <Text style={{ fontSize: 10, color: "#8c8c8c", marginTop: 8 }}>{item.date}</Text>
                    </Flex>
                  );
                })}
              </Flex>
            </div>
            <Divider style={{ margin: "12px 0" }} />
            <Flex justify="center" gap={24}>
              <Space size={4}><div style={{ width: 10, height: 10, borderRadius: 2, background: "#0f6fa8" }} /><Text style={{ fontSize: 11 }}>Messages</Text></Space>
              <Space size={4}><Text style={{ fontSize: 11, color: "#0f6fa8", fontWeight: 600 }}>$</Text><Text style={{ fontSize: 11 }}>Cost</Text></Space>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<Space><PieChartOutlined /><span>Usage by Model</span></Space>}
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <Space orientation="vertical" style={{ width: "100%" }} size={14}>
              {modelUsage.map((item) => (
                <div key={item.model}>
                  <Flex justify="space-between" style={{ marginBottom: 4 }}>
                    <Flex gap={8} align="center">
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
                      <Text style={{ fontSize: 12, fontWeight: 500 }}>{item.model}</Text>
                    </Flex>
                    <Space size={12}>
                      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{formatTokens(item.tokens)}</Text>
                      <Text style={{ fontSize: 12, fontWeight: 600, color: "#0f6fa8" }}>{formatCurrency(item.cost)}</Text>
                    </Space>
                  </Flex>
                  <Progress
                    percent={item.percentage}
                    showInfo={false}
                    strokeColor={item.color}
                    size="small"
                  />
                </div>
              ))}
            </Space>
            <Divider style={{ margin: "12px 0" }} />
            <Flex justify="space-between">
              <Text strong>Total</Text>
              <Text strong style={{ color: "#0f6fa8" }}>
                {formatCurrency(modelUsage.reduce((s, m) => s + m.cost, 0))}
              </Text>
            </Flex>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={<Space><BarChartOutlined /><span>Usage by Agent</span></Space>}
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <Space orientation="vertical" style={{ width: "100%" }} size={14}>
              {agentUsage.map((item) => (
                <div key={item.agent}>
                  <Flex justify="space-between" style={{ marginBottom: 4 }}>
                    <Space>
                      <RobotOutlined style={{ color: "#0f6fa8", fontSize: 12 }} />
                      <Text style={{ fontSize: 12, fontWeight: 500 }}>{item.agent}</Text>
                    </Space>
                    <Space size={16}>
                      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{item.messages} msgs</Text>
                      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{item.avgResponseTime}s avg</Text>
                      <Text style={{ fontSize: 12, fontWeight: 600, color: "#0f6fa8" }}>{formatCurrency(item.cost)}</Text>
                    </Space>
                  </Flex>
                  <Progress
                    percent={(item.messages / maxAgentMessages) * 100}
                    showInfo={false}
                    strokeColor={{ from: "#0f6fa8", to: "#0ea5a4" }}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={<Space><RiseOutlined /><span>Cost Projections</span></Space>}
            style={{ borderRadius: 10, marginBottom: 16 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <Space orientation="vertical" style={{ width: "100%" }} size={12}>
              <Flex justify="space-between" align="center" style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                <Text style={{ fontSize: 12, color: "#8c8c8c" }}>Current Month</Text>
                <Text style={{ fontSize: 16, fontWeight: 700, color: "#0f6fa8" }}>{formatCurrency(totalCost * 4.3)}</Text>
              </Flex>
              {costProjections.map((proj) => (
                <Flex key={proj.month} justify="space-between" align="center">
                  <Text style={{ fontSize: 12 }}>{proj.month}</Text>
                  <Space>
                    <RiseOutlined style={{ color: "#fa8c16", fontSize: 12 }} />
                    <Text style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(proj.projected)}</Text>
                  </Space>
                </Flex>
              ))}
            </Space>
          </Card>

          <Card
            title={<Space><TeamOutlined /><span>Token Budget by Team</span></Space>}
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <Space orientation="vertical" style={{ width: "100%" }} size={10}>
              {teamBudgets.map((team) => {
                const usedPercent = (team.used / team.allocated) * 100;
                return (
                  <div key={team.team}>
                    <Flex justify="space-between" style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: 500 }}>{team.team}</Text>
                      <Space size={4}>
                        <Text style={{ fontSize: 11, fontWeight: 600, color: usedPercent > 80 ? "#ff4d4f" : "#0f6fa8" }}>
                          {formatCurrency(team.used)}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#8c8c8c" }}>/ {formatCurrency(team.allocated)}</Text>
                      </Space>
                    </Flex>
                    <Progress
                      percent={usedPercent}
                      showInfo={false}
                      strokeColor={usedPercent > 90 ? "#ff4d4f" : usedPercent > 70 ? "#fa8c16" : "#52c41a"}
                      size="small"
                    />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={<Space><UserOutlined /><span>Top Users</span></Space>}
        style={{ borderRadius: 10 }}
      >
        <Table
          dataSource={topUsers}
          columns={userColumns}
          rowKey="user"
          pagination={{ pageSize: 10, showTotal: (total) => `${total} users` }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default UsageAnalytics;
