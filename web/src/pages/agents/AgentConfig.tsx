import React, { useState } from "react";
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Drawer,
  Space,
  Typography,
  Tag,
  Input,
  Select,
  Slider,
  InputNumber,
  Form,
  Switch,
  Tabs,
  Avatar,
  Flex,
  Timeline,
  Divider,
  Tooltip,
  message,
} from "antd";
import {
  PlusOutlined,
  RobotOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  HistoryOutlined,
  SendOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/formatters";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AgentConfigItem {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  knowledgeBase: string | null;
  status: "active" | "draft" | "disabled";
  version: number;
  createdAt: string;
  updatedAt: string;
  versions: { version: number; updatedAt: string; changes: string }[];
}

const availableModels = [
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "gemini-ultra", label: "Gemini Ultra" },
];

const availableTools = [
  { value: "code_search", label: "Code Search" },
  { value: "file_read", label: "File Reader" },
  { value: "file_write", label: "File Writer" },
  { value: "terminal", label: "Terminal Executor" },
  { value: "web_search", label: "Web Search" },
  { value: "database_query", label: "Database Query" },
  { value: "api_call", label: "API Caller" },
  { value: "image_gen", label: "Image Generation" },
  { value: "calculator", label: "Calculator" },
  { value: "email_send", label: "Email Sender" },
];

const availableKBs = [
  { value: "kb-001", label: "Company Documentation" },
  { value: "kb-002", label: "Product Knowledge" },
  { value: "kb-003", label: "Technical Guides" },
  { value: "kb-004", label: "Customer Support FAQ" },
];

const mockAgents: AgentConfigItem[] = [
  {
    id: "ag-001",
    name: "Customer Support Agent",
    description: "Handles customer inquiries, troubleshooting, and ticket resolution with empathetic tone",
    model: "claude-3.5-sonnet",
    systemPrompt: "You are a helpful customer support agent for our SaaS platform. Be empathetic, patient, and thorough. Always verify the customer's identity before sharing account details. Escalate to a human agent when you cannot resolve an issue within 3 exchanges.",
    temperature: 0.3,
    maxTokens: 4096,
    tools: ["database_query", "email_send", "web_search"],
    knowledgeBase: "kb-004",
    status: "active",
    version: 5,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-02-25T14:30:00Z",
    versions: [
      { version: 5, updatedAt: "2026-02-25T14:30:00Z", changes: "Added escalation instructions" },
      { version: 4, updatedAt: "2026-02-18T09:15:00Z", changes: "Updated tone guidelines" },
      { version: 3, updatedAt: "2026-02-10T16:00:00Z", changes: "Added database query tool" },
      { version: 2, updatedAt: "2026-01-28T11:00:00Z", changes: "Refined system prompt" },
      { version: 1, updatedAt: "2026-01-10T10:00:00Z", changes: "Initial creation" },
    ],
  },
  {
    id: "ag-002",
    name: "Code Review Agent",
    description: "Automated code review with focus on security, performance, and best practices",
    model: "gpt-4o",
    systemPrompt: "You are an expert code reviewer. Focus on: 1) Security vulnerabilities 2) Performance bottlenecks 3) Code quality and maintainability 4) Testing coverage. Provide actionable feedback with code examples.",
    temperature: 0.2,
    maxTokens: 8192,
    tools: ["code_search", "file_read", "terminal"],
    knowledgeBase: "kb-003",
    status: "active",
    version: 3,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-02-20T10:00:00Z",
    versions: [
      { version: 3, updatedAt: "2026-02-20T10:00:00Z", changes: "Added terminal tool for test running" },
      { version: 2, updatedAt: "2026-02-05T09:00:00Z", changes: "Enhanced security focus" },
      { version: 1, updatedAt: "2026-01-15T10:00:00Z", changes: "Initial creation" },
    ],
  },
  {
    id: "ag-003",
    name: "Data Analysis Agent",
    description: "Analyzes datasets, generates insights, creates visualizations, and summarizes findings",
    model: "gpt-4o",
    systemPrompt: "You are a data analyst. Analyze data thoroughly, provide statistical insights, identify trends and anomalies. Present findings in clear, actionable summaries. Use charts and tables when appropriate.",
    temperature: 0.4,
    maxTokens: 4096,
    tools: ["database_query", "calculator", "file_read"],
    knowledgeBase: null,
    status: "active",
    version: 2,
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-02-15T12:00:00Z",
    versions: [
      { version: 2, updatedAt: "2026-02-15T12:00:00Z", changes: "Added calculator tool" },
      { version: 1, updatedAt: "2026-01-20T10:00:00Z", changes: "Initial creation" },
    ],
  },
  {
    id: "ag-004",
    name: "Content Writer Agent",
    description: "Generates marketing content, blog posts, and documentation with brand voice consistency",
    model: "claude-3.5-sonnet",
    systemPrompt: "You are a professional content writer. Write engaging, SEO-optimized content that matches our brand voice: professional yet approachable. Use clear headings, short paragraphs, and actionable language.",
    temperature: 0.7,
    maxTokens: 4096,
    tools: ["web_search", "image_gen"],
    knowledgeBase: "kb-002",
    status: "draft",
    version: 1,
    createdAt: "2026-02-22T10:00:00Z",
    updatedAt: "2026-02-22T10:00:00Z",
    versions: [
      { version: 1, updatedAt: "2026-02-22T10:00:00Z", changes: "Initial creation" },
    ],
  },
  {
    id: "ag-005",
    name: "Onboarding Assistant",
    description: "Guides new users through product setup and feature discovery with interactive walkthroughs",
    model: "gemini-pro",
    systemPrompt: "You are a friendly onboarding assistant. Guide new users step-by-step through product setup. Be encouraging and patient. Offer tips and shortcuts when appropriate.",
    temperature: 0.5,
    maxTokens: 2048,
    tools: ["web_search"],
    knowledgeBase: "kb-001",
    status: "disabled",
    version: 4,
    createdAt: "2026-01-05T10:00:00Z",
    updatedAt: "2026-02-10T08:00:00Z",
    versions: [
      { version: 4, updatedAt: "2026-02-10T08:00:00Z", changes: "Disabled for maintenance" },
      { version: 3, updatedAt: "2026-02-01T10:00:00Z", changes: "Updated walkthrough flow" },
      { version: 2, updatedAt: "2026-01-20T10:00:00Z", changes: "Added interactive tips" },
      { version: 1, updatedAt: "2026-01-05T10:00:00Z", changes: "Initial creation" },
    ],
  },
  {
    id: "ag-006",
    name: "Meeting Summarizer",
    description: "Summarizes meeting transcripts, extracts action items, and generates follow-up tasks",
    model: "gpt-4o-mini",
    systemPrompt: "You summarize meeting transcripts. Extract: 1) Key decisions 2) Action items with owners 3) Open questions 4) Next steps. Format as a structured summary.",
    temperature: 0.2,
    maxTokens: 2048,
    tools: ["email_send", "api_call"],
    knowledgeBase: null,
    status: "active",
    version: 2,
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-18T14:00:00Z",
    versions: [
      { version: 2, updatedAt: "2026-02-18T14:00:00Z", changes: "Added email notification" },
      { version: 1, updatedAt: "2026-02-01T10:00:00Z", changes: "Initial creation" },
    ],
  },
];

const AgentConfig: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | "test">("create");
  const [selectedAgent, setSelectedAgent] = useState<AgentConfigItem | null>(null);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [form] = Form.useForm();

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setSelectedAgent(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEditDrawer = (agent: AgentConfigItem) => {
    setDrawerMode("edit");
    setSelectedAgent(agent);
    form.setFieldsValue({
      name: agent.name,
      description: agent.description,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      tools: agent.tools,
      knowledgeBase: agent.knowledgeBase,
    });
    setDrawerOpen(true);
  };

  const openTestDrawer = (agent: AgentConfigItem) => {
    setDrawerMode("test");
    setSelectedAgent(agent);
    setTestMessage("");
    setTestResponse(null);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      console.log("Saving agent:", values);
      message.success(drawerMode === "create" ? "Agent created successfully" : "Agent updated successfully");
      setDrawerOpen(false);
    });
  };

  const handleTest = () => {
    if (!testMessage.trim()) return;
    setTestLoading(true);
    setTimeout(() => {
      setTestResponse(`Based on your query "${testMessage}", here is a comprehensive response from the ${selectedAgent?.name} agent.\n\nThis is a simulated response demonstrating the agent's capabilities using the ${selectedAgent?.model} model with temperature ${selectedAgent?.temperature}.\n\nThe agent has access to the following tools: ${selectedAgent?.tools.join(", ")}.\n\nTokens used: 847 | Latency: 1,240ms`);
      setTestLoading(false);
    }, 1500);
  };

  const handleToggleStatus = (agent: AgentConfigItem) => {
    const newStatus = agent.status === "active" ? "disabled" : "active";
    console.log(`Toggling agent ${agent.id} to ${newStatus}`);
    message.success(`Agent ${newStatus === "active" ? "enabled" : "disabled"}`);
  };

  const statusColors: Record<string, string> = {
    active: "success",
    draft: "processing",
    disabled: "default",
  };

  const columns = [
    {
      title: "Agent",
      key: "agent",
      width: 260,
      render: (_: unknown, record: AgentConfigItem) => (
        <Flex gap={10} align="center">
          <Avatar size={36} icon={<RobotOutlined />} style={{ backgroundColor: record.status === "active" ? "#0f6fa8" : record.status === "draft" ? "#fa8c16" : "#d9d9d9", flexShrink: 0 }} />
          <div>
            <Text strong style={{ fontSize: 13, display: "block" }}>{record.name}</Text>
            <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{record.description.substring(0, 60)}...</Text>
          </div>
        </Flex>
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
      title: "System Prompt",
      dataIndex: "systemPrompt",
      key: "systemPrompt",
      ellipsis: true,
      render: (prompt: string) => (
        <Tooltip title={prompt}>
          <Text style={{ fontSize: 12, color: "#595959" }}>{prompt.substring(0, 80)}...</Text>
        </Tooltip>
      ),
    },
    {
      title: "Tools",
      dataIndex: "tools",
      key: "tools",
      width: 160,
      render: (tools: string[]) => (
        <Flex wrap="wrap" gap={2}>
          {tools.slice(0, 2).map((t) => (
            <Tag key={t} style={{ borderRadius: 4, fontSize: 10, padding: "0 4px", margin: 0 }}>{t.replace("_", " ")}</Tag>
          ))}
          {tools.length > 2 && <Tag style={{ borderRadius: 4, fontSize: 10, padding: "0 4px", margin: 0 }}>+{tools.length - 2}</Tag>}
        </Flex>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => <StatusBadge status={status} colorMap={statusColors} />,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 70,
      align: "center" as const,
      render: (v: number) => <Tag style={{ borderRadius: 10, fontSize: 11 }}>v{v}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (_: unknown, record: AgentConfigItem) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)} /></Tooltip>
          <Tooltip title="Test"><Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => openTestDrawer(record)} /></Tooltip>
          <Tooltip title={record.status === "active" ? "Disable" : "Enable"}>
            <Switch size="small" checked={record.status === "active"} onChange={() => handleToggleStatus(record)} />
          </Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => console.log("Delete:", record.id)} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Agent Configuration"
        subtitle="Create, configure, and manage AI agents"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Agent Config" }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
            Create Agent
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 10, textAlign: "center", borderLeft: "4px solid #52c41a" }}>
            <Flex vertical align="center">
              <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a", marginBottom: 8 }} />
              <Text style={{ fontSize: 24, fontWeight: 700 }}>{mockAgents.filter((a) => a.status === "active").length}</Text>
              <Text style={{ fontSize: 13, color: "#8c8c8c" }}>Active Agents</Text>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 10, textAlign: "center", borderLeft: "4px solid #fa8c16" }}>
            <Flex vertical align="center">
              <ClockCircleOutlined style={{ fontSize: 24, color: "#fa8c16", marginBottom: 8 }} />
              <Text style={{ fontSize: 24, fontWeight: 700 }}>{mockAgents.filter((a) => a.status === "draft").length}</Text>
              <Text style={{ fontSize: 13, color: "#8c8c8c" }}>Draft Agents</Text>
            </Flex>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 10, textAlign: "center", borderLeft: "4px solid #d9d9d9" }}>
            <Flex vertical align="center">
              <SettingOutlined style={{ fontSize: 24, color: "#8c8c8c", marginBottom: 8 }} />
              <Text style={{ fontSize: 24, fontWeight: 700 }}>{mockAgents.filter((a) => a.status === "disabled").length}</Text>
              <Text style={{ fontSize: 13, color: "#8c8c8c" }}>Disabled Agents</Text>
            </Flex>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 10 }}>
        <Table dataSource={mockAgents} columns={columns} rowKey="id" pagination={{ pageSize: 10, showTotal: (total) => `${total} agents` }} />
      </Card>

      <Drawer
        title={drawerMode === "create" ? "Create New Agent" : drawerMode === "edit" ? `Edit: ${selectedAgent?.name}` : `Test: ${selectedAgent?.name}`}
        placement="right"
        width={drawerMode === "test" ? 560 : 640}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          drawerMode !== "test" && (
            <Space>
              <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave}>
                {drawerMode === "create" ? "Create" : "Save Changes"}
              </Button>
            </Space>
          )
        }
      >
        {drawerMode === "test" && selectedAgent ? (
          <div>
            <Card size="small" style={{ marginBottom: 16, borderRadius: 8, background: "#fafafa" }}>
              <Flex justify="space-between">
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Model</Text>
                  <Tag style={{ fontFamily: "monospace" }}>{selectedAgent.model}</Tag>
                </Space>
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Temperature</Text>
                  <Text strong>{selectedAgent.temperature}</Text>
                </Space>
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Max Tokens</Text>
                  <Text strong>{selectedAgent.maxTokens}</Text>
                </Space>
              </Flex>
            </Card>

            <Divider>System Prompt Preview</Divider>
            <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 11, whiteSpace: "pre-wrap", marginBottom: 16, maxHeight: 120, overflow: "auto" }}>
              {selectedAgent.systemPrompt}
            </pre>

            <Divider>Test Panel</Divider>
            <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
              <Input
                placeholder="Type a test message..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onPressEnter={handleTest}
                style={{ flex: 1 }}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleTest} loading={testLoading}>
                Send
              </Button>
            </Space.Compact>

            {testResponse && (
              <Card size="small" style={{ borderRadius: 8, background: "#f6ffed", borderColor: "#b7eb8f" }}>
                <Flex gap={10}>
                  <Avatar size={28} icon={<RobotOutlined />} style={{ backgroundColor: "#52c41a", flexShrink: 0 }} />
                  <div>
                    <Text strong style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Agent Response</Text>
                    <Paragraph style={{ fontSize: 12, margin: 0, whiteSpace: "pre-wrap" }}>{testResponse}</Paragraph>
                  </div>
                </Flex>
              </Card>
            )}

            <Divider>Version History</Divider>
            <Timeline
              items={selectedAgent.versions.map((v) => ({
                color: v.version === selectedAgent.version ? "green" : "gray",
                children: (
                  <div>
                    <Flex justify="space-between">
                      <Text strong style={{ fontSize: 12 }}>v{v.version}</Text>
                      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{formatDate(v.updatedAt, "MMM DD, HH:mm")}</Text>
                    </Flex>
                    <Text style={{ fontSize: 11, color: "#595959" }}>{v.changes}</Text>
                  </div>
                ),
              }))}
            />
          </div>
        ) : (
          <Form form={form} layout="vertical" requiredMark="optional">
            <Form.Item name="name" label="Agent Name" rules={[{ required: true, message: "Enter agent name" }]}>
              <Input placeholder="e.g. Customer Support Agent" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={2} placeholder="Describe what this agent does..." />
            </Form.Item>

            <Form.Item name="model" label="AI Model" rules={[{ required: true, message: "Select a model" }]}>
              <Select placeholder="Select model" options={availableModels} />
            </Form.Item>

            <Form.Item name="systemPrompt" label="System Prompt" rules={[{ required: true, message: "Enter system prompt" }]}>
              <TextArea rows={8} placeholder="You are a helpful assistant that..." style={{ fontFamily: "monospace", fontSize: 12 }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="temperature" label="Temperature" initialValue={0.3}>
                  <Slider min={0} max={1} step={0.1} marks={{ 0: "Precise", 0.5: "Balanced", 1: "Creative" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="maxTokens" label="Max Tokens" initialValue={4096}>
                  <InputNumber min={256} max={32768} step={256} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="tools" label="Available Tools">
              <Select mode="multiple" placeholder="Select tools" options={availableTools} maxTagCount={4} />
            </Form.Item>

            <Form.Item name="knowledgeBase" label="Knowledge Base">
              <Select placeholder="Select knowledge base (optional)" options={availableKBs} allowClear />
            </Form.Item>

            {drawerMode === "edit" && selectedAgent && (
              <>
                <Divider>Version History</Divider>
                <Timeline
                  items={selectedAgent.versions.slice(0, 3).map((v) => ({
                    color: v.version === selectedAgent.version ? "green" : "gray",
                    children: (
                      <div>
                        <Flex justify="space-between">
                          <Text strong style={{ fontSize: 12 }}>v{v.version}</Text>
                          <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{formatDate(v.updatedAt, "MMM DD, HH:mm")}</Text>
                        </Flex>
                        <Text style={{ fontSize: 11, color: "#595959" }}>{v.changes}</Text>
                      </div>
                    ),
                  }))}
                />
              </>
            )}
          </Form>
        )}
      </Drawer>
    </div>
  );
};

export default AgentConfig;
