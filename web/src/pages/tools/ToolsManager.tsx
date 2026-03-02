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
  Form,
  Flex,
  Avatar,
  Switch,
  Divider,
  Tabs,
  Progress,
  Checkbox,
  message,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  ToolOutlined,
  ApiOutlined,
  DatabaseOutlined,
  FileOutlined,
  FunctionOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  SendOutlined,
  BarChartOutlined,
  LockOutlined,
  CheckOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/common/KPICard";
import StatusBadge from "@/components/common/StatusBadge";
import { formatDate, formatNumber } from "@/utils/formatters";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Tool {
  id: string;
  name: string;
  type: "function" | "api" | "database" | "file";
  description: string;
  parameters: string;
  endpointUrl: string | null;
  usageCount: number;
  lastUsed: string | null;
  status: "active" | "inactive" | "error";
  permissions: string[];
  avgLatencyMs: number;
  successRate: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  function: <FunctionOutlined />,
  api: <ApiOutlined />,
  database: <DatabaseOutlined />,
  file: <FileOutlined />,
};

const typeColors: Record<string, string> = {
  function: "blue",
  api: "purple",
  database: "green",
  file: "orange",
};

const mockTools: Tool[] = [
  {
    id: "t1",
    name: "code_search",
    type: "function",
    description: "Searches codebase for patterns, functions, and files using AST-aware search with regex support",
    parameters: '{\n  "query": { "type": "string", "required": true, "description": "Search pattern or regex" },\n  "file_types": { "type": "array", "items": "string", "description": "File extensions to search" },\n  "max_results": { "type": "number", "default": 10 }\n}',
    endpointUrl: null,
    usageCount: 1842,
    lastUsed: "2026-02-28T10:25:00Z",
    status: "active",
    permissions: ["Code Review Agent", "Code Generator"],
    avgLatencyMs: 120,
    successRate: 99.2,
  },
  {
    id: "t2",
    name: "database_query",
    type: "database",
    description: "Executes read-only SQL queries against the analytics database with parameterized inputs",
    parameters: '{\n  "query": { "type": "string", "required": true, "description": "SQL query (SELECT only)" },\n  "params": { "type": "object", "description": "Query parameters" },\n  "limit": { "type": "number", "default": 100 }\n}',
    endpointUrl: "postgres://analytics-db:5432/erp",
    usageCount: 956,
    lastUsed: "2026-02-28T10:20:00Z",
    status: "active",
    permissions: ["Data Analysis Agent", "Customer Support Agent"],
    avgLatencyMs: 340,
    successRate: 97.8,
  },
  {
    id: "t3",
    name: "web_search",
    type: "api",
    description: "Performs web searches using Google Custom Search API and returns structured results",
    parameters: '{\n  "query": { "type": "string", "required": true, "description": "Search query" },\n  "num_results": { "type": "number", "default": 5 },\n  "date_restrict": { "type": "string", "description": "e.g. d7 for last 7 days" }\n}',
    endpointUrl: "https://www.googleapis.com/customsearch/v1",
    usageCount: 723,
    lastUsed: "2026-02-28T09:50:00Z",
    status: "active",
    permissions: ["Content Writer Agent", "Customer Support Agent", "Onboarding Assistant"],
    avgLatencyMs: 680,
    successRate: 95.4,
  },
  {
    id: "t4",
    name: "file_read",
    type: "file",
    description: "Reads file contents from the project repository with support for multiple formats",
    parameters: '{\n  "path": { "type": "string", "required": true, "description": "Relative file path" },\n  "encoding": { "type": "string", "default": "utf-8" },\n  "lines": { "type": "object", "properties": { "start": "number", "end": "number" } }\n}',
    endpointUrl: null,
    usageCount: 2134,
    lastUsed: "2026-02-28T10:22:00Z",
    status: "active",
    permissions: ["Code Review Agent", "Code Generator", "Data Analysis Agent"],
    avgLatencyMs: 45,
    successRate: 99.8,
  },
  {
    id: "t5",
    name: "file_write",
    type: "file",
    description: "Writes or modifies files in the project repository with diff-based change tracking",
    parameters: '{\n  "path": { "type": "string", "required": true, "description": "Relative file path" },\n  "content": { "type": "string", "required": true, "description": "File content" },\n  "mode": { "type": "string", "enum": ["overwrite", "append", "patch"] }\n}',
    endpointUrl: null,
    usageCount: 1456,
    lastUsed: "2026-02-28T10:18:00Z",
    status: "active",
    permissions: ["Code Generator"],
    avgLatencyMs: 65,
    successRate: 98.9,
  },
  {
    id: "t6",
    name: "email_send",
    type: "api",
    description: "Sends emails through the configured SMTP/SendGrid provider with template support",
    parameters: '{\n  "to": { "type": "string", "required": true, "description": "Recipient email" },\n  "subject": { "type": "string", "required": true },\n  "body": { "type": "string", "required": true },\n  "template_id": { "type": "string", "description": "Email template ID" }\n}',
    endpointUrl: "https://api.sendgrid.com/v3/mail/send",
    usageCount: 312,
    lastUsed: "2026-02-28T08:30:00Z",
    status: "active",
    permissions: ["Customer Support Agent", "Meeting Summarizer"],
    avgLatencyMs: 420,
    successRate: 99.1,
  },
  {
    id: "t7",
    name: "calculator",
    type: "function",
    description: "Evaluates mathematical expressions and statistical functions safely",
    parameters: '{\n  "expression": { "type": "string", "required": true, "description": "Math expression" },\n  "precision": { "type": "number", "default": 4 }\n}',
    endpointUrl: null,
    usageCount: 189,
    lastUsed: "2026-02-27T16:00:00Z",
    status: "active",
    permissions: ["Data Analysis Agent"],
    avgLatencyMs: 5,
    successRate: 100,
  },
  {
    id: "t8",
    name: "terminal",
    type: "function",
    description: "Executes sandboxed terminal commands for build, test, and lint operations",
    parameters: '{\n  "command": { "type": "string", "required": true, "description": "Shell command" },\n  "timeout_ms": { "type": "number", "default": 30000 },\n  "cwd": { "type": "string", "description": "Working directory" }\n}',
    endpointUrl: null,
    usageCount: 534,
    lastUsed: "2026-02-28T10:15:00Z",
    status: "active",
    permissions: ["Code Review Agent"],
    avgLatencyMs: 2800,
    successRate: 92.1,
  },
  {
    id: "t9",
    name: "image_gen",
    type: "api",
    description: "Generates images using DALL-E 3 API for content and documentation illustrations",
    parameters: '{\n  "prompt": { "type": "string", "required": true, "description": "Image description" },\n  "size": { "type": "string", "enum": ["256x256", "512x512", "1024x1024"] },\n  "style": { "type": "string", "enum": ["natural", "vivid"] }\n}',
    endpointUrl: "https://api.openai.com/v1/images/generations",
    usageCount: 87,
    lastUsed: "2026-02-26T14:00:00Z",
    status: "inactive",
    permissions: ["Content Writer Agent"],
    avgLatencyMs: 8500,
    successRate: 88.5,
  },
  {
    id: "t10",
    name: "api_call",
    type: "api",
    description: "Makes HTTP requests to external APIs with authentication and retry support",
    parameters: '{\n  "url": { "type": "string", "required": true },\n  "method": { "type": "string", "enum": ["GET", "POST", "PUT", "DELETE"] },\n  "headers": { "type": "object" },\n  "body": { "type": "object" }\n}',
    endpointUrl: null,
    usageCount: 412,
    lastUsed: "2026-02-28T09:00:00Z",
    status: "active",
    permissions: ["Meeting Summarizer", "Customer Support Agent"],
    avgLatencyMs: 520,
    successRate: 96.3,
  },
];

const allAgents = [
  "Customer Support Agent",
  "Code Review Agent",
  "Code Generator",
  "Data Analysis Agent",
  "Content Writer Agent",
  "Meeting Summarizer",
  "Onboarding Assistant",
];

const mockUsageByTool = [
  { name: "file_read", count: 2134 },
  { name: "code_search", count: 1842 },
  { name: "file_write", count: 1456 },
  { name: "database_query", count: 956 },
  { name: "web_search", count: 723 },
  { name: "terminal", count: 534 },
];

const ToolsManager: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | "test" | "permissions">("create");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [form] = Form.useForm();

  const totalTools = mockTools.length;
  const activeTools = mockTools.filter((t) => t.status === "active").length;
  const totalUsage = mockTools.reduce((s, t) => s + t.usageCount, 0);
  const avgSuccessRate = mockTools.reduce((s, t) => s + t.successRate, 0) / totalTools;
  const maxUsage = Math.max(...mockUsageByTool.map((t) => t.count));

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setSelectedTool(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEditDrawer = (tool: Tool) => {
    setDrawerMode("edit");
    setSelectedTool(tool);
    form.setFieldsValue({
      name: tool.name,
      type: tool.type,
      description: tool.description,
      parameters: tool.parameters,
      endpointUrl: tool.endpointUrl,
    });
    setDrawerOpen(true);
  };

  const openTestDrawer = (tool: Tool) => {
    setDrawerMode("test");
    setSelectedTool(tool);
    setTestInput("");
    setTestOutput(null);
    setDrawerOpen(true);
  };

  const openPermissions = (tool: Tool) => {
    setDrawerMode("permissions");
    setSelectedTool(tool);
    setDrawerOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      console.log("Saving tool:", values);
      message.success(drawerMode === "create" ? "Tool created successfully" : "Tool updated successfully");
      setDrawerOpen(false);
    });
  };

  const handleTest = () => {
    if (!testInput.trim()) return;
    setTestLoading(true);
    setTimeout(() => {
      setTestOutput(JSON.stringify({
        status: "success",
        result: `Simulated response from ${selectedTool?.name} tool`,
        latency_ms: selectedTool?.avgLatencyMs || 100,
        metadata: { tool: selectedTool?.name, type: selectedTool?.type },
      }, null, 2));
      setTestLoading(false);
    }, 1000);
  };

  const statusColors: Record<string, string> = {
    active: "success",
    inactive: "default",
    error: "error",
  };

  const columns = [
    {
      title: "Tool",
      key: "tool",
      width: 240,
      render: (_: unknown, record: Tool) => (
        <Flex gap={10} align="center">
          <Avatar
            size={34}
            icon={typeIcons[record.type]}
            style={{ backgroundColor: record.status === "active" ? "#0f6fa8" : "#d9d9d9", flexShrink: 0 }}
          />
          <div>
            <Text strong style={{ fontSize: 13, display: "block", fontFamily: "monospace" }}>{record.name}</Text>
            <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{record.description.substring(0, 50)}...</Text>
          </div>
        </Flex>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      filters: [
        { text: "Function", value: "function" },
        { text: "API", value: "api" },
        { text: "Database", value: "database" },
        { text: "File", value: "file" },
      ],
      onFilter: (value: unknown, record: Tool) => record.type === value,
      render: (type: string) => (
        <Tag color={typeColors[type]} icon={typeIcons[type]} style={{ borderRadius: 4, fontSize: 11 }}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Usage",
      dataIndex: "usageCount",
      key: "usageCount",
      width: 80,
      sorter: (a: Tool, b: Tool) => a.usageCount - b.usageCount,
      render: (count: number) => <Text style={{ fontSize: 13, fontWeight: 600 }}>{formatNumber(count)}</Text>,
    },
    {
      title: "Latency",
      dataIndex: "avgLatencyMs",
      key: "avgLatencyMs",
      width: 90,
      render: (ms: number) => (
        <Text style={{ fontSize: 12, color: ms > 1000 ? "#fa8c16" : ms > 5000 ? "#ff4d4f" : "#52c41a" }}>
          {ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`}
        </Text>
      ),
    },
    {
      title: "Success Rate",
      dataIndex: "successRate",
      key: "successRate",
      width: 120,
      render: (rate: number) => (
        <Space>
          <Progress
            percent={rate}
            size="small"
            style={{ width: 60 }}
            showInfo={false}
            strokeColor={rate >= 98 ? "#52c41a" : rate >= 95 ? "#fa8c16" : "#ff4d4f"}
          />
          <Text style={{ fontSize: 11 }}>{rate}%</Text>
        </Space>
      ),
    },
    {
      title: "Agents",
      dataIndex: "permissions",
      key: "permissions",
      width: 100,
      render: (perms: string[]) => (
        <Tooltip title={perms.join(", ")}>
          <Tag style={{ borderRadius: 10, fontSize: 11 }}>{perms.length} agents</Tag>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (status: string) => <StatusBadge status={status} colorMap={statusColors} />,
    },
    {
      title: "",
      key: "actions",
      width: 150,
      render: (_: unknown, record: Tool) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)} /></Tooltip>
          <Tooltip title="Test"><Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => openTestDrawer(record)} /></Tooltip>
          <Tooltip title="Permissions"><Button type="text" size="small" icon={<LockOutlined />} onClick={() => openPermissions(record)} /></Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Skills & Tools Manager"
        subtitle="Configure, test, and manage tools available to AI agents"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Tools" }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
            Create Tool
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Total Tools" value={totalTools} prefix={<ToolOutlined />} borderColor="#0f6fa8" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Active" value={activeTools} prefix={<CheckOutlined />} borderColor="#52c41a" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Total Invocations" value={formatNumber(totalUsage)} prefix={<BarChartOutlined />} trend={16.4} trendLabel="vs last week" borderColor="#fa8c16" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Avg Success Rate" value={`${avgSuccessRate.toFixed(1)}%`} prefix={<CheckOutlined />} borderColor="#722ed1" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Tool Usage Analytics" style={{ borderRadius: 10 }} bodyStyle={{ padding: "16px 24px" }}>
            <Space orientation="vertical" style={{ width: "100%" }} size={12}>
              {mockUsageByTool.map((item) => (
                <div key={item.name}>
                  <Flex justify="space-between" style={{ marginBottom: 4 }}>
                    <Space>
                      <CodeOutlined style={{ color: "#0f6fa8", fontSize: 12 }} />
                      <Text style={{ fontSize: 12, fontWeight: 500, fontFamily: "monospace" }}>{item.name}</Text>
                    </Space>
                    <Text style={{ fontSize: 12, fontWeight: 600 }}>{formatNumber(item.count)} calls</Text>
                  </Flex>
                  <Progress
                    percent={(item.count / maxUsage) * 100}
                    showInfo={false}
                    strokeColor={{ from: "#0f6fa8", to: "#0ea5a4" }}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 10 }}>
        <Table
          dataSource={mockTools}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `${total} tools` }}
          size="middle"
        />
      </Card>

      <Drawer
        title={
          drawerMode === "create" ? "Create New Tool" :
          drawerMode === "edit" ? `Edit: ${selectedTool?.name}` :
          drawerMode === "test" ? `Test: ${selectedTool?.name}` :
          `Permissions: ${selectedTool?.name}`
        }
        placement="right"
        width={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          (drawerMode === "create" || drawerMode === "edit") && (
            <Space>
              <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave}>
                {drawerMode === "create" ? "Create" : "Save"}
              </Button>
            </Space>
          )
        }
      >
        {(drawerMode === "create" || drawerMode === "edit") && (
          <Form form={form} layout="vertical" requiredMark="optional">
            <Form.Item name="name" label="Tool Name" rules={[{ required: true, message: "Enter tool name" }]}>
              <Input placeholder="e.g. web_search" style={{ fontFamily: "monospace" }} />
            </Form.Item>
            <Form.Item name="type" label="Type" rules={[{ required: true, message: "Select type" }]}>
              <Select placeholder="Select type" options={[
                { value: "function", label: "Function" },
                { value: "api", label: "API" },
                { value: "database", label: "Database" },
                { value: "file", label: "File" },
              ]} />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true, message: "Enter description" }]}>
              <TextArea rows={2} placeholder="Describe what this tool does..." />
            </Form.Item>
            <Form.Item name="parameters" label="Parameters Schema (JSON)" rules={[{ required: true, message: "Enter parameters" }]}>
              <TextArea
                rows={8}
                placeholder='{\n  "param_name": {\n    "type": "string",\n    "required": true,\n    "description": "..."\n  }\n}'
                style={{ fontFamily: "monospace", fontSize: 12 }}
              />
            </Form.Item>
            <Form.Item name="endpointUrl" label="Endpoint URL (for API/Database types)">
              <Input placeholder="https://api.example.com/v1/..." />
            </Form.Item>
          </Form>
        )}

        {drawerMode === "test" && selectedTool && (
          <div>
            <Card size="small" style={{ marginBottom: 16, borderRadius: 8, background: "#fafafa" }}>
              <Flex justify="space-between">
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Type</Text>
                  <Tag color={typeColors[selectedTool.type]} icon={typeIcons[selectedTool.type]}>{selectedTool.type}</Tag>
                </Space>
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Avg Latency</Text>
                  <Text strong>{selectedTool.avgLatencyMs}ms</Text>
                </Space>
                <Space orientation="vertical" size={2}>
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Success Rate</Text>
                  <Text strong style={{ color: "#52c41a" }}>{selectedTool.successRate}%</Text>
                </Space>
              </Flex>
            </Card>

            <Divider>Parameters Schema</Divider>
            <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 11, marginBottom: 16, maxHeight: 150, overflow: "auto" }}>
              {selectedTool.parameters}
            </pre>

            <Divider>Test Input</Divider>
            <TextArea
              rows={4}
              placeholder='{\n  "query": "test input"\n}'
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 12 }}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleTest} loading={testLoading} block>
              Run Test
            </Button>

            {testOutput && (
              <>
                <Divider>Response</Divider>
                <pre
                  style={{
                    background: "#1a1a2e",
                    color: "#d4d4d4",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 12,
                    lineHeight: 1.6,
                    overflow: "auto",
                    maxHeight: 200,
                  }}
                >
                  {testOutput}
                </pre>
              </>
            )}
          </div>
        )}

        {drawerMode === "permissions" && selectedTool && (
          <div>
            <Text style={{ fontSize: 13, color: "#595959", display: "block", marginBottom: 16 }}>
              Select which agents can use the <Text strong style={{ fontFamily: "monospace" }}>{selectedTool.name}</Text> tool:
            </Text>
            <Space orientation="vertical" style={{ width: "100%" }} size={12}>
              {allAgents.map((agent) => (
                <Card key={agent} size="small" style={{ borderRadius: 8 }}>
                  <Flex justify="space-between" align="center">
                    <Space>
                      <Avatar size={28} icon={<ToolOutlined />} style={{ backgroundColor: "#0f6fa8" }} />
                      <Text style={{ fontSize: 13 }}>{agent}</Text>
                    </Space>
                    <Switch
                      defaultChecked={selectedTool.permissions.includes(agent)}
                      onChange={(checked) => console.log(`${agent}: ${checked}`)}
                    />
                  </Flex>
                </Card>
              ))}
            </Space>
            <Divider />
            <Button type="primary" block onClick={() => { message.success("Permissions updated"); setDrawerOpen(false); }}>
              Save Permissions
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ToolsManager;
