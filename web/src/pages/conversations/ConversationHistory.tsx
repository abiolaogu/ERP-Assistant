import React, { useState } from "react";
import {
  Table,
  Card,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Tag,
  Button,
  Drawer,
  Space,
  Typography,
  Rate,
  Flex,
  Progress,
  Avatar,
  Tooltip,
  Divider,
} from "antd";
import {
  SearchOutlined,
  MessageOutlined,
  UserOutlined,
  RobotOutlined,
  ExportOutlined,
  ClockCircleOutlined,
  StarOutlined,
  FilterOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/common/KPICard";
import StatusBadge from "@/components/common/StatusBadge";
import { formatDate, formatNumber, formatTokens } from "@/utils/formatters";

const { Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model?: string;
  tokens?: number;
  latencyMs?: number;
}

interface Conversation {
  id: string;
  user: string;
  userAvatar?: string;
  topic: string;
  model: string;
  startedAt: string;
  endedAt?: string;
  messageCount: number;
  tokensUsed: number;
  rating: number | null;
  status: "active" | "completed" | "abandoned";
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: "conv-001",
    user: "Sarah Johnson",
    topic: "Implementing JWT Authentication",
    model: "Claude 3.5 Sonnet",
    startedAt: "2026-02-28T09:15:00Z",
    endedAt: "2026-02-28T09:32:00Z",
    messageCount: 12,
    tokensUsed: 18420,
    rating: 5,
    status: "completed",
    messages: [
      { id: "m1", role: "user", content: "How do I implement JWT authentication in a Node.js Express app?", timestamp: "2026-02-28T09:15:00Z" },
      { id: "m2", role: "assistant", content: "I'll walk you through implementing JWT authentication in Express. Here's a step-by-step approach:\n\n1. Install the required packages:\n```bash\nnpm install jsonwebtoken bcryptjs\n```\n\n2. Create an auth middleware:\n```typescript\nimport jwt from 'jsonwebtoken';\n\nexport const authMiddleware = (req, res, next) => {\n  const token = req.header('Authorization')?.replace('Bearer ', '');\n  if (!token) return res.status(401).json({ error: 'Access denied' });\n  \n  try {\n    const verified = jwt.verify(token, process.env.JWT_SECRET);\n    req.user = verified;\n    next();\n  } catch (err) {\n    res.status(400).json({ error: 'Invalid token' });\n  }\n};\n```", timestamp: "2026-02-28T09:15:05Z", model: "claude-3.5-sonnet", tokens: 1240, latencyMs: 1850 },
      { id: "m3", role: "user", content: "How should I handle token refresh?", timestamp: "2026-02-28T09:18:00Z" },
      { id: "m4", role: "assistant", content: "For token refresh, implement a dual-token strategy with access tokens (short-lived, 15min) and refresh tokens (long-lived, 7 days). Store refresh tokens in an HTTP-only cookie and provide a `/refresh` endpoint that validates the refresh token and issues a new access token.", timestamp: "2026-02-28T09:18:04Z", model: "claude-3.5-sonnet", tokens: 980, latencyMs: 1620 },
      { id: "m5", role: "user", content: "What about storing tokens securely on the client?", timestamp: "2026-02-28T09:22:00Z" },
      { id: "m6", role: "assistant", content: "Never store tokens in localStorage due to XSS vulnerability. Use HTTP-only, Secure, SameSite cookies for refresh tokens. For access tokens, keep them in memory (JavaScript variable/React state). This provides the best security balance.", timestamp: "2026-02-28T09:22:03Z", model: "claude-3.5-sonnet", tokens: 860, latencyMs: 1450 },
    ],
  },
  {
    id: "conv-002",
    user: "Michael Chen",
    topic: "Database Migration Strategy",
    model: "GPT-4o",
    startedAt: "2026-02-28T08:45:00Z",
    endedAt: "2026-02-28T09:10:00Z",
    messageCount: 8,
    tokensUsed: 12850,
    rating: 4,
    status: "completed",
    messages: [
      { id: "m1", role: "user", content: "We need to migrate from MySQL to PostgreSQL. What's the best strategy?", timestamp: "2026-02-28T08:45:00Z" },
      { id: "m2", role: "assistant", content: "A MySQL to PostgreSQL migration requires careful planning. I recommend a phased approach:\n\n1. Schema conversion using pgloader or AWS DMS\n2. Data type mapping (MySQL INT -> PostgreSQL INTEGER, etc.)\n3. Query compatibility testing\n4. Dual-write period for validation\n5. Final cutover with rollback plan", timestamp: "2026-02-28T08:45:06Z", model: "gpt-4o", tokens: 1520, latencyMs: 2100 },
    ],
  },
  {
    id: "conv-003",
    user: "Emily Rodriguez",
    topic: "React Performance Optimization",
    model: "Claude 3.5 Sonnet",
    startedAt: "2026-02-28T10:00:00Z",
    messageCount: 15,
    tokensUsed: 24300,
    rating: 5,
    status: "active",
    messages: [
      { id: "m1", role: "user", content: "My React app is slow. How do I optimize it?", timestamp: "2026-02-28T10:00:00Z" },
      { id: "m2", role: "assistant", content: "Let's diagnose and optimize your React app. Common performance issues include:\n\n1. Unnecessary re-renders - use React.memo, useMemo, useCallback\n2. Large bundle size - implement code splitting with React.lazy\n3. Unoptimized images - use next/image or lazy loading\n4. Missing virtualization for long lists - use react-window\n5. Heavy computations on main thread - use Web Workers\n\nStart by profiling with React DevTools Profiler to identify bottlenecks.", timestamp: "2026-02-28T10:00:04Z", model: "claude-3.5-sonnet", tokens: 1680, latencyMs: 2200 },
    ],
  },
  {
    id: "conv-004",
    user: "David Kim",
    topic: "Kubernetes Deployment Configuration",
    model: "GPT-4o",
    startedAt: "2026-02-27T14:20:00Z",
    endedAt: "2026-02-27T14:55:00Z",
    messageCount: 10,
    tokensUsed: 15670,
    rating: 3,
    status: "completed",
    messages: [
      { id: "m1", role: "user", content: "Help me set up a Kubernetes deployment for my microservices", timestamp: "2026-02-27T14:20:00Z" },
      { id: "m2", role: "assistant", content: "I'll help you create Kubernetes manifests for your microservices deployment. Let's start with the basic components you'll need: Deployments, Services, ConfigMaps, and Ingress.", timestamp: "2026-02-27T14:20:05Z", model: "gpt-4o", tokens: 1340, latencyMs: 1900 },
    ],
  },
  {
    id: "conv-005",
    user: "Lisa Wang",
    topic: "GraphQL Schema Design",
    model: "Claude 3.5 Sonnet",
    startedAt: "2026-02-27T11:30:00Z",
    endedAt: "2026-02-27T12:05:00Z",
    messageCount: 14,
    tokensUsed: 21200,
    rating: 5,
    status: "completed",
    messages: [
      { id: "m1", role: "user", content: "What are best practices for GraphQL schema design?", timestamp: "2026-02-27T11:30:00Z" },
      { id: "m2", role: "assistant", content: "Great question! Here are key GraphQL schema design best practices: Use clear naming conventions, implement cursor-based pagination, leverage interfaces and unions, design for the client's needs, and always consider backwards compatibility.", timestamp: "2026-02-27T11:30:03Z", model: "claude-3.5-sonnet", tokens: 1100, latencyMs: 1550 },
    ],
  },
  {
    id: "conv-006",
    user: "James Taylor",
    topic: "CI/CD Pipeline Setup",
    model: "Gemini Pro",
    startedAt: "2026-02-27T09:00:00Z",
    endedAt: "2026-02-27T09:40:00Z",
    messageCount: 9,
    tokensUsed: 13900,
    rating: null,
    status: "abandoned",
    messages: [
      { id: "m1", role: "user", content: "Set up a CI/CD pipeline with GitHub Actions", timestamp: "2026-02-27T09:00:00Z" },
      { id: "m2", role: "assistant", content: "I'll help you create a comprehensive CI/CD pipeline using GitHub Actions. We'll set up build, test, and deploy stages.", timestamp: "2026-02-27T09:00:04Z", model: "gemini-pro", tokens: 920, latencyMs: 1780 },
    ],
  },
  {
    id: "conv-007",
    user: "Sarah Johnson",
    topic: "API Rate Limiting Implementation",
    model: "Claude 3.5 Sonnet",
    startedAt: "2026-02-26T15:10:00Z",
    endedAt: "2026-02-26T15:45:00Z",
    messageCount: 11,
    tokensUsed: 16800,
    rating: 4,
    status: "completed",
    messages: [
      { id: "m1", role: "user", content: "How do I implement rate limiting for my REST API?", timestamp: "2026-02-26T15:10:00Z" },
      { id: "m2", role: "assistant", content: "Rate limiting is crucial for API protection. I recommend using a sliding window approach with Redis for distributed systems. Here's how to implement it with express-rate-limit and rate-limit-redis.", timestamp: "2026-02-26T15:10:03Z", model: "claude-3.5-sonnet", tokens: 1450, latencyMs: 1920 },
    ],
  },
  {
    id: "conv-008",
    user: "Michael Chen",
    topic: "Microservices Communication Patterns",
    model: "GPT-4o",
    startedAt: "2026-02-26T10:20:00Z",
    endedAt: "2026-02-26T11:00:00Z",
    messageCount: 13,
    tokensUsed: 19500,
    rating: 5,
    status: "completed",
    messages: [
      { id: "m1", role: "user", content: "What communication patterns should I use between microservices?", timestamp: "2026-02-26T10:20:00Z" },
      { id: "m2", role: "assistant", content: "For microservices communication, choose based on your use case: Synchronous (REST/gRPC) for real-time needs, Asynchronous (message queues like RabbitMQ/Kafka) for event-driven architectures, and Event Sourcing/CQRS for complex domains.", timestamp: "2026-02-26T10:20:05Z", model: "gpt-4o", tokens: 1380, latencyMs: 2050 },
    ],
  },
];

const mockConversationsPerDay = [
  { date: "Feb 22", count: 18 },
  { date: "Feb 23", count: 24 },
  { date: "Feb 24", count: 15 },
  { date: "Feb 25", count: 22 },
  { date: "Feb 26", count: 31 },
  { date: "Feb 27", count: 28 },
  { date: "Feb 28", count: 19 },
];

const modelOptions = [
  { value: "all", label: "All Models" },
  { value: "Claude 3.5 Sonnet", label: "Claude 3.5 Sonnet" },
  { value: "GPT-4o", label: "GPT-4o" },
  { value: "Gemini Pro", label: "Gemini Pro" },
];

const ratingOptions = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "2", label: "2 Stars" },
  { value: "1", label: "1 Star" },
  { value: "none", label: "No Rating" },
];

const userOptions = [
  { value: "all", label: "All Users" },
  { value: "Sarah Johnson", label: "Sarah Johnson" },
  { value: "Michael Chen", label: "Michael Chen" },
  { value: "Emily Rodriguez", label: "Emily Rodriguez" },
  { value: "David Kim", label: "David Kim" },
  { value: "Lisa Wang", label: "Lisa Wang" },
  { value: "James Taylor", label: "James Taylor" },
];

const ConversationHistory: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const filteredConversations = mockConversations.filter((conv) => {
    if (searchText && !conv.topic.toLowerCase().includes(searchText.toLowerCase()) &&
        !conv.messages.some((m) => m.content.toLowerCase().includes(searchText.toLowerCase()))) {
      return false;
    }
    if (selectedModel !== "all" && conv.model !== selectedModel) return false;
    if (selectedUser !== "all" && conv.user !== selectedUser) return false;
    if (selectedRating !== "all") {
      if (selectedRating === "none" && conv.rating !== null) return false;
      if (selectedRating !== "none" && conv.rating !== parseInt(selectedRating)) return false;
    }
    return true;
  });

  const totalConversations = mockConversations.length;
  const totalMessages = mockConversations.reduce((s, c) => s + c.messageCount, 0);
  const totalTokens = mockConversations.reduce((s, c) => s + c.tokensUsed, 0);
  const avgRating = mockConversations.filter((c) => c.rating).reduce((s, c, _, a) => s + (c.rating || 0) / a.length, 0);
  const maxBarValue = Math.max(...mockConversationsPerDay.map((d) => d.count));

  const openDrawer = (conv: Conversation) => {
    setSelectedConversation(conv);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: 150,
      render: (user: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#0f6fa8" }} />
          <Text style={{ fontSize: 13, fontWeight: 500 }}>{user}</Text>
        </Space>
      ),
    },
    {
      title: "Topic",
      dataIndex: "topic",
      key: "topic",
      ellipsis: true,
      render: (topic: string, record: Conversation) => (
        <Button type="link" style={{ padding: 0, fontSize: 13 }} onClick={() => openDrawer(record)}>
          {topic}
        </Button>
      ),
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 150,
      render: (model: string) => <Tag style={{ borderRadius: 4, fontFamily: "monospace", fontSize: 11 }}>{model}</Tag>,
    },
    {
      title: "Started",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 140,
      render: (date: string) => <Text style={{ fontSize: 12 }}>{formatDate(date, "MMM DD, HH:mm")}</Text>,
    },
    {
      title: "Messages",
      dataIndex: "messageCount",
      key: "messageCount",
      width: 90,
      align: "center" as const,
      render: (count: number) => (
        <Space size={4}>
          <MessageOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
          <Text style={{ fontSize: 13 }}>{count}</Text>
        </Space>
      ),
    },
    {
      title: "Tokens",
      dataIndex: "tokensUsed",
      key: "tokensUsed",
      width: 90,
      render: (tokens: number) => <Text style={{ fontSize: 12, fontFamily: "monospace" }}>{formatTokens(tokens)}</Text>,
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 120,
      render: (rating: number | null) =>
        rating !== null ? <Rate disabled defaultValue={rating} style={{ fontSize: 12 }} /> : <Text style={{ color: "#bfbfbf", fontSize: 12 }}>No rating</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_: unknown, record: Conversation) => (
        <Space>
          <Tooltip title="View conversation">
            <Button type="text" size="small" icon={<MessageOutlined />} onClick={() => openDrawer(record)} />
          </Tooltip>
          <Tooltip title="Export">
            <Button type="text" size="small" icon={<DownloadOutlined />} onClick={() => console.log("Export:", record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Conversation History"
        subtitle="Browse, search, and analyze all AI assistant conversations"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Conversations" }]}
        extra={
          <Button icon={<ExportOutlined />} onClick={() => console.log("Export all")}>
            Export All
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Total Conversations" value={totalConversations} prefix={<MessageOutlined />} trend={14.2} trendLabel="vs last week" borderColor="#0f6fa8" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Total Messages" value={formatNumber(totalMessages)} prefix={<ThunderboltOutlined />} trend={22.8} trendLabel="vs last week" borderColor="#52c41a" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Tokens Used" value={formatTokens(totalTokens)} prefix={<ClockCircleOutlined />} trend={18.5} trendLabel="vs last week" borderColor="#fa8c16" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Avg Rating" value={avgRating.toFixed(1)} prefix={<StarOutlined />} trend={5.3} trendLabel="vs last week" borderColor="#722ed1" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={24}>
          <Card title="Conversations Per Day" style={{ borderRadius: 10 }} bodyStyle={{ padding: "16px 24px" }}>
            <div style={{ height: 160 }}>
              <Flex align="flex-end" gap={16} style={{ height: "100%", paddingTop: 8 }}>
                {mockConversationsPerDay.map((item) => {
                  const heightPercent = (item.count / maxBarValue) * 100;
                  return (
                    <Flex key={item.date} vertical align="center" justify="flex-end" style={{ flex: 1, height: "100%" }}>
                      <Text style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 4 }}>{item.count}</Text>
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
                      <Text style={{ fontSize: 11, color: "#8c8c8c", marginTop: 8 }}>{item.date}</Text>
                    </Flex>
                  );
                })}
              </Flex>
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 10 }}>
        <Flex gap={12} wrap="wrap" style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search conversations by content..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select value={selectedUser} onChange={setSelectedUser} options={userOptions} style={{ width: 160 }} suffixIcon={<FilterOutlined />} />
          <Select value={selectedModel} onChange={setSelectedModel} options={modelOptions} style={{ width: 180 }} />
          <Select value={selectedRating} onChange={setSelectedRating} options={ratingOptions} style={{ width: 140 }} />
          <RangePicker style={{ width: 260 }} />
        </Flex>

        <Table
          dataSource={filteredConversations}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} conversations` }}
          size="middle"
        />
      </Card>

      <Drawer
        title={selectedConversation?.topic || "Conversation"}
        placement="right"
        width={640}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => console.log("Export conversation")}>
              Export
            </Button>
          </Space>
        }
      >
        {selectedConversation && (
          <div>
            <Card size="small" style={{ marginBottom: 16, borderRadius: 8, background: "#fafafa" }}>
              <Flex justify="space-between" align="center">
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c" }}>User</Text>
                  <Text strong>{selectedConversation.user}</Text>
                </Space>
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c" }}>Model</Text>
                  <Tag style={{ fontFamily: "monospace", margin: 0 }}>{selectedConversation.model}</Tag>
                </Space>
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c" }}>Messages</Text>
                  <Text strong>{selectedConversation.messageCount}</Text>
                </Space>
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c" }}>Tokens</Text>
                  <Text strong>{formatTokens(selectedConversation.tokensUsed)}</Text>
                </Space>
              </Flex>
              {selectedConversation.rating && (
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 12, color: "#8c8c8c", marginRight: 8 }}>Rating:</Text>
                  <Rate disabled defaultValue={selectedConversation.rating} style={{ fontSize: 14 }} />
                </div>
              )}
            </Card>

            <Divider style={{ margin: "12px 0" }}>Messages</Divider>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {selectedConversation.messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", flexDirection: msg.role === "user" ? "row" : "row", gap: 10 }}>
                  <Avatar
                    size={32}
                    icon={msg.role === "user" ? <UserOutlined /> : <RobotOutlined />}
                    style={{ backgroundColor: msg.role === "user" ? "#0f6fa8" : "#52c41a", flexShrink: 0, marginTop: 2 }}
                  />
                  <div style={{ flex: 1 }}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 13 }}>{msg.role === "user" ? selectedConversation.user : "Assistant"}</Text>
                      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{formatDate(msg.timestamp, "HH:mm:ss")}</Text>
                    </Flex>
                    <div
                      style={{
                        background: msg.role === "user" ? "#e6f4ff" : "#f6ffed",
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 13 }}>{msg.content}</Paragraph>
                    </div>
                    {msg.role === "assistant" && (
                      <Flex gap={16} style={{ marginTop: 4, paddingLeft: 4 }}>
                        {msg.model && (
                          <Text style={{ fontSize: 10, color: "#bfbfbf" }}>Model: {msg.model}</Text>
                        )}
                        {msg.tokens && (
                          <Text style={{ fontSize: 10, color: "#bfbfbf" }}>Tokens: {formatTokens(msg.tokens)}</Text>
                        )}
                        {msg.latencyMs && (
                          <Text style={{ fontSize: 10, color: "#bfbfbf" }}>Latency: {msg.latencyMs}ms</Text>
                        )}
                      </Flex>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ConversationHistory;
