import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Drawer,
  Rate,
  Flex,
  Divider,
  Tabs,
  Avatar,
  Tooltip,
  message,
} from "antd";
import {
  PlusOutlined,
  StarOutlined,
  StarFilled,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  SendOutlined,
  HeartOutlined,
  HeartFilled,
  FireOutlined,
  SearchOutlined,
  CodeOutlined,
  CustomerServiceOutlined,
  BarChartOutlined,
  FormOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import { formatDate, formatNumber } from "@/utils/formatters";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  exampleInputs: Record<string, string>;
  exampleOutput: string;
  usageCount: number;
  avgRating: number;
  ratingCount: number;
  author: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "customer_support": <CustomerServiceOutlined />,
  "data_analysis": <BarChartOutlined />,
  "code_generation": <CodeOutlined />,
  "content": <FormOutlined />,
  "summarization": <ReadOutlined />,
};

const categoryColors: Record<string, string> = {
  "customer_support": "blue",
  "data_analysis": "purple",
  "code_generation": "green",
  "content": "orange",
  "summarization": "cyan",
};

const mockPrompts: PromptTemplate[] = [
  {
    id: "p1",
    name: "Customer Issue Resolution",
    category: "customer_support",
    template: "You are a customer support specialist. A customer named {{customer_name}} has reported the following issue:\n\n{{issue_description}}\n\nTheir account tier is {{account_tier}}. Please:\n1. Acknowledge the issue empathetically\n2. Provide a step-by-step resolution\n3. Offer compensation if applicable\n4. Follow up with preventive measures",
    variables: ["customer_name", "issue_description", "account_tier"],
    exampleInputs: { customer_name: "John Smith", issue_description: "Unable to export reports for the past 2 days", account_tier: "Enterprise" },
    exampleOutput: "Dear John,\n\nI understand how frustrating it must be to not be able to export your reports, especially as an Enterprise customer who relies on this feature. I sincerely apologize for the inconvenience.\n\nHere's how we can resolve this:\n1. Clear your browser cache and cookies\n2. Try using an incognito/private window\n3. If the issue persists, I've escalated this to our engineering team (ticket #EXP-4521)\n\nAs compensation for the disruption, I've extended your current billing cycle by 3 days.\n\nBest regards,\nSupport Team",
    usageCount: 342,
    avgRating: 4.7,
    ratingCount: 89,
    author: "Sarah Johnson",
    isFavorite: true,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-02-20T14:00:00Z",
  },
  {
    id: "p2",
    name: "SQL Query Generator",
    category: "code_generation",
    template: "Generate a {{database_type}} SQL query for the following requirement:\n\n{{requirement}}\n\nTable schema:\n{{schema}}\n\nRequirements:\n- Optimize for performance\n- Include proper indexes suggestions\n- Add comments explaining the query logic\n- Handle NULL values appropriately",
    variables: ["database_type", "requirement", "schema"],
    exampleInputs: { database_type: "PostgreSQL", requirement: "Find top 10 customers by revenue in the last 30 days", schema: "customers(id, name, email), orders(id, customer_id, total, created_at)" },
    exampleOutput: "-- Top 10 customers by revenue in last 30 days\n-- Includes customer details with aggregated order totals\nSELECT \n  c.id,\n  c.name,\n  c.email,\n  COALESCE(SUM(o.total), 0) AS total_revenue,\n  COUNT(o.id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\n  AND o.created_at >= NOW() - INTERVAL '30 days'\nGROUP BY c.id, c.name, c.email\nORDER BY total_revenue DESC\nLIMIT 10;\n\n-- Suggested index:\n-- CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at);",
    usageCount: 285,
    avgRating: 4.8,
    ratingCount: 72,
    author: "Michael Chen",
    isFavorite: true,
    createdAt: "2026-01-20T10:00:00Z",
    updatedAt: "2026-02-18T10:00:00Z",
  },
  {
    id: "p3",
    name: "Data Analysis Report",
    category: "data_analysis",
    template: "Analyze the following dataset and provide insights:\n\nDataset: {{dataset_name}}\nMetrics: {{metrics}}\nTime Period: {{time_period}}\n\nPlease provide:\n1. Executive summary (2-3 sentences)\n2. Key trends and patterns\n3. Anomalies or outliers\n4. Actionable recommendations\n5. Suggested follow-up analyses",
    variables: ["dataset_name", "metrics", "time_period"],
    exampleInputs: { dataset_name: "User Engagement Data", metrics: "DAU, session duration, feature usage", time_period: "Q4 2025" },
    exampleOutput: "Executive Summary: User engagement showed a 15% increase in DAU during Q4 2025, driven primarily by the new dashboard feature. However, session duration decreased by 8%, suggesting users are completing tasks faster.\n\nKey Trends:\n- DAU peaked at 12,400 in December\n- Feature adoption rate: Dashboard (78%), Reports (45%), API (23%)\n\nRecommendations:\n1. Invest in dashboard enhancements\n2. Improve reports discoverability\n3. Create API onboarding tutorials",
    usageCount: 198,
    avgRating: 4.5,
    ratingCount: 45,
    author: "Emily Rodriguez",
    isFavorite: false,
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-22T10:00:00Z",
  },
  {
    id: "p4",
    name: "Blog Post Generator",
    category: "content",
    template: "Write a blog post about {{topic}}.\n\nTarget audience: {{audience}}\nTone: {{tone}}\nLength: {{word_count}} words\n\nInclude:\n- Engaging headline\n- Introduction with a hook\n- 3-5 main sections with subheadings\n- Practical examples or case studies\n- Call-to-action conclusion\n- SEO-optimized meta description",
    variables: ["topic", "audience", "tone", "word_count"],
    exampleInputs: { topic: "Benefits of microservices architecture", audience: "CTOs and engineering managers", tone: "Professional, authoritative", word_count: "1500" },
    exampleOutput: "# Why Microservices Architecture Is Your Competitive Advantage in 2026\n\nMeta: Discover how microservices architecture can transform your engineering organization...\n\n## Introduction\nIn an era where deployment speed determines market success...\n\n## 1. Independent Scaling\n...\n\n## 2. Technology Flexibility\n...\n\n## Conclusion\nThe shift to microservices is not just a technical decision...",
    usageCount: 156,
    avgRating: 4.2,
    ratingCount: 38,
    author: "Lisa Wang",
    isFavorite: false,
    createdAt: "2026-02-05T10:00:00Z",
    updatedAt: "2026-02-15T10:00:00Z",
  },
  {
    id: "p5",
    name: "Meeting Summary",
    category: "summarization",
    template: "Summarize the following meeting transcript:\n\n{{transcript}}\n\nMeeting Type: {{meeting_type}}\nParticipants: {{participants}}\n\nProvide:\n1. Meeting summary (3-5 sentences)\n2. Key decisions made\n3. Action items with owners and deadlines\n4. Open questions/parking lot items\n5. Next meeting agenda suggestions",
    variables: ["transcript", "meeting_type", "participants"],
    exampleInputs: { transcript: "[Meeting transcript here]", meeting_type: "Sprint Planning", participants: "Product Manager, Tech Lead, 4 Engineers" },
    exampleOutput: "Meeting Summary:\nThe sprint planning session covered 12 user stories for Sprint 24. The team committed to 34 story points, slightly below the 38-point velocity.\n\nKey Decisions:\n- Prioritize payment refactoring over new features\n- Adopt new testing framework starting this sprint\n\nAction Items:\n1. @TechLead: Set up new testing framework by Wed 3/1\n2. @PM: Clarify requirements for story US-456 by Thu 3/2\n\nOpen Questions:\n- Should we migrate to the new API gateway this quarter?",
    usageCount: 423,
    avgRating: 4.9,
    ratingCount: 108,
    author: "David Kim",
    isFavorite: true,
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-02-25T10:00:00Z",
  },
  {
    id: "p6",
    name: "Code Review Checklist",
    category: "code_generation",
    template: "Review the following {{language}} code for a {{project_type}} project:\n\n```{{language}}\n{{code}}\n```\n\nFocus areas:\n1. Security vulnerabilities (OWASP Top 10)\n2. Performance bottlenecks\n3. Code maintainability and SOLID principles\n4. Error handling completeness\n5. Test coverage suggestions",
    variables: ["language", "project_type", "code"],
    exampleInputs: { language: "TypeScript", project_type: "REST API", code: "// paste code here" },
    exampleOutput: "Code Review Results:\n\nSecurity: [HIGH] Input validation missing on line 15. Add zod schema validation.\nPerformance: [MEDIUM] N+1 query pattern detected. Use DataLoader or batch queries.\nMaintainability: [LOW] Extract auth logic into middleware.\nError Handling: [HIGH] Unhandled promise rejection in async handler.",
    usageCount: 267,
    avgRating: 4.6,
    ratingCount: 63,
    author: "James Taylor",
    isFavorite: false,
    createdAt: "2026-01-25T10:00:00Z",
    updatedAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "p7",
    name: "Ticket Escalation Response",
    category: "customer_support",
    template: "Draft an escalation response for the following support ticket:\n\nTicket ID: {{ticket_id}}\nPriority: {{priority}}\nCustomer Issue: {{issue}}\nPrevious Attempts: {{previous_attempts}}\n\nInclude:\n- Acknowledgment of frustration\n- Summary of steps taken\n- Escalation path and timeline\n- Interim workaround if available",
    variables: ["ticket_id", "priority", "issue", "previous_attempts"],
    exampleInputs: { ticket_id: "TKT-8842", priority: "Critical", issue: "Production API returning 500 errors", previous_attempts: "Restarted service, checked logs, verified database connection" },
    exampleOutput: "Subject: [ESCALATED] TKT-8842 - Production API Errors\n\nDear Customer,\n\nI understand the critical impact this is having on your operations. Here's a summary of our investigation:\n\nSteps Taken:\n- Service restart (no improvement)\n- Log analysis (identified memory leak pattern)\n- Database connection verified (healthy)\n\nEscalation: This has been escalated to our Senior Engineering team. Expected response within 2 hours.\n\nInterim Workaround: You can use our backup API endpoint at api-backup.example.com while we resolve this.",
    usageCount: 189,
    avgRating: 4.4,
    ratingCount: 42,
    author: "Ana Martinez",
    isFavorite: true,
    createdAt: "2026-02-08T10:00:00Z",
    updatedAt: "2026-02-24T10:00:00Z",
  },
];

const PromptLibrary: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(mockPrompts.filter((p) => p.isFavorite).map((p) => p.id)));
  const [form] = Form.useForm();

  const filteredPrompts = mockPrompts.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (searchText && !p.name.toLowerCase().includes(searchText.toLowerCase()) && !p.template.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const favoritePrompts = mockPrompts.filter((p) => favorites.has(p.id));
  const mostUsed = [...mockPrompts].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);

  const openPromptDetail = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setTestVariables(prompt.exampleInputs);
    setTestOutput(null);
    setDrawerOpen(true);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleTest = () => {
    if (!selectedPrompt) return;
    setTestLoading(true);
    setTimeout(() => {
      setTestOutput(selectedPrompt.exampleOutput);
      setTestLoading(false);
    }, 1200);
  };

  const handleCreatePrompt = () => {
    form.validateFields().then((values) => {
      console.log("Creating prompt:", values);
      message.success("Prompt template created successfully");
      setCreateModalOpen(false);
      form.resetFields();
    });
  };

  const columns = [
    {
      title: "",
      key: "favorite",
      width: 40,
      render: (_: unknown, record: PromptTemplate) => (
        <Button
          type="text"
          size="small"
          icon={favorites.has(record.id) ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined style={{ color: "#d9d9d9" }} />}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(record.id); }}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: PromptTemplate) => (
        <Button type="link" style={{ padding: 0, fontSize: 13, fontWeight: 500 }} onClick={() => openPromptDetail(record)}>
          {name}
        </Button>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 150,
      render: (cat: string) => (
        <Tag color={categoryColors[cat]} icon={categoryIcons[cat]} style={{ borderRadius: 4, fontSize: 11 }}>
          {cat.replace("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Usage",
      dataIndex: "usageCount",
      key: "usageCount",
      width: 80,
      sorter: (a: PromptTemplate, b: PromptTemplate) => a.usageCount - b.usageCount,
      render: (count: number) => <Text style={{ fontSize: 12, fontWeight: 600 }}>{formatNumber(count)}</Text>,
    },
    {
      title: "Rating",
      dataIndex: "avgRating",
      key: "avgRating",
      width: 140,
      sorter: (a: PromptTemplate, b: PromptTemplate) => a.avgRating - b.avgRating,
      render: (rating: number, record: PromptTemplate) => (
        <Space size={4}>
          <Rate disabled defaultValue={rating} style={{ fontSize: 12 }} allowHalf />
          <Text style={{ fontSize: 11, color: "#8c8c8c" }}>({record.ratingCount})</Text>
        </Space>
      ),
    },
    {
      title: "Author",
      dataIndex: "author",
      key: "author",
      width: 130,
      render: (author: string) => <Text style={{ fontSize: 12 }}>{author}</Text>,
    },
    {
      title: "Variables",
      dataIndex: "variables",
      key: "variables",
      width: 100,
      render: (vars: string[]) => <Tag style={{ borderRadius: 10, fontSize: 11 }}>{vars.length} vars</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_: unknown, record: PromptTemplate) => (
        <Space size={4}>
          <Tooltip title="Use"><Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => openPromptDetail(record)} /></Tooltip>
          <Tooltip title="Copy"><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(record.template); message.success("Copied to clipboard"); }} /></Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Prompt Library"
        subtitle="Browse, create, and test reusable prompt templates"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Prompts" }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            Create Prompt
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Favorites" style={{ borderRadius: 10 }} bodyStyle={{ padding: "12px 24px" }}>
            {favoritePrompts.length > 0 ? (
              <Flex gap={12} wrap="wrap">
                {favoritePrompts.map((p) => (
                  <Card
                    key={p.id}
                    size="small"
                    hoverable
                    style={{ borderRadius: 8, width: 200 }}
                    onClick={() => openPromptDetail(p)}
                  >
                    <Flex vertical>
                      <Flex align="center" gap={6} style={{ marginBottom: 4 }}>
                        {categoryIcons[p.category]}
                        <Text strong style={{ fontSize: 12 }}>{p.name}</Text>
                      </Flex>
                      <Tag color={categoryColors[p.category]} style={{ borderRadius: 4, fontSize: 10, width: "fit-content" }}>
                        {p.category.replace("_", " ")}
                      </Tag>
                      <Flex justify="space-between" style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 10, color: "#8c8c8c" }}>{p.usageCount} uses</Text>
                        <Rate disabled defaultValue={p.avgRating} style={{ fontSize: 10 }} />
                      </Flex>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            ) : (
              <Text style={{ color: "#bfbfbf" }}>No favorites yet. Click the heart icon to add favorites.</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Space><FireOutlined style={{ color: "#ff4d4f" }} /><span>Most Used</span></Space>}
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "12px 24px" }}
          >
            <Space orientation="vertical" style={{ width: "100%" }} size={10}>
              {mostUsed.map((p, i) => (
                <Flex key={p.id} justify="space-between" align="center">
                  <Space>
                    <Avatar size={22} style={{ backgroundColor: i < 3 ? "#fa8c16" : "#d9d9d9", fontSize: 11 }}>{i + 1}</Avatar>
                    <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }} onClick={() => openPromptDetail(p)}>
                      {p.name}
                    </Button>
                  </Space>
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{formatNumber(p.usageCount)} uses</Text>
                </Flex>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 10 }}>
        <Flex gap={12} style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search prompts..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
            options={[
              { value: "all", label: "All Categories" },
              { value: "customer_support", label: "Customer Support" },
              { value: "data_analysis", label: "Data Analysis" },
              { value: "code_generation", label: "Code Generation" },
              { value: "content", label: "Content" },
              { value: "summarization", label: "Summarization" },
            ]}
          />
        </Flex>

        <Table dataSource={filteredPrompts} columns={columns} rowKey="id" pagination={{ pageSize: 10, showTotal: (total) => `${total} prompts` }} />
      </Card>

      <Drawer
        title={selectedPrompt?.name || "Prompt Detail"}
        placement="right"
        width={640}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedPrompt && (
          <Tabs
            defaultActiveKey="detail"
            items={[
              {
                key: "detail",
                label: "Details",
                children: (
                  <div>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                      <Tag color={categoryColors[selectedPrompt.category]} icon={categoryIcons[selectedPrompt.category]} style={{ borderRadius: 4 }}>
                        {selectedPrompt.category.replace("_", " ")}
                      </Tag>
                      <Space>
                        <Rate disabled defaultValue={selectedPrompt.avgRating} style={{ fontSize: 14 }} />
                        <Text style={{ fontSize: 12, color: "#8c8c8c" }}>({selectedPrompt.ratingCount} ratings)</Text>
                      </Space>
                    </Flex>

                    <Flex gap={24} style={{ marginBottom: 16 }}>
                      <Space orientation="vertical" size={2}>
                        <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Usage Count</Text>
                        <Text strong>{formatNumber(selectedPrompt.usageCount)}</Text>
                      </Space>
                      <Space orientation="vertical" size={2}>
                        <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Author</Text>
                        <Text strong>{selectedPrompt.author}</Text>
                      </Space>
                      <Space orientation="vertical" size={2}>
                        <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Updated</Text>
                        <Text strong>{formatDate(selectedPrompt.updatedAt, "MMM DD, YYYY")}</Text>
                      </Space>
                    </Flex>

                    <Divider>Template</Divider>
                    <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.6, border: "1px solid #e8e8e8" }}>
                      {selectedPrompt.template}
                    </pre>

                    <Divider>Variables</Divider>
                    <Flex gap={6} wrap="wrap">
                      {selectedPrompt.variables.map((v) => (
                        <Tag key={v} color="blue" style={{ borderRadius: 4, fontFamily: "monospace" }}>{`{{${v}}}`}</Tag>
                      ))}
                    </Flex>

                    <Divider>Example Output</Divider>
                    <pre style={{ background: "#f6ffed", padding: 16, borderRadius: 8, fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.6, border: "1px solid #b7eb8f" }}>
                      {selectedPrompt.exampleOutput}
                    </pre>
                  </div>
                ),
              },
              {
                key: "test",
                label: "Test",
                children: (
                  <div>
                    <Text strong style={{ display: "block", marginBottom: 12 }}>Fill in variables:</Text>
                    <Space orientation="vertical" style={{ width: "100%", marginBottom: 16 }} size={8}>
                      {selectedPrompt.variables.map((v) => (
                        <div key={v}>
                          <Text style={{ fontSize: 12, color: "#595959", display: "block", marginBottom: 4 }}>
                            {`{{${v}}}`}
                          </Text>
                          <TextArea
                            rows={v === "code" || v === "transcript" ? 4 : 1}
                            value={testVariables[v] || ""}
                            onChange={(e) => setTestVariables((prev) => ({ ...prev, [v]: e.target.value }))}
                            placeholder={selectedPrompt.exampleInputs[v] || `Enter ${v}...`}
                            style={{ fontFamily: "monospace", fontSize: 12 }}
                          />
                        </div>
                      ))}
                    </Space>

                    <Flex gap={8} style={{ marginBottom: 16 }}>
                      <Select defaultValue="claude-3.5-sonnet" style={{ width: 200 }} options={[
                        { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
                        { value: "gpt-4o", label: "GPT-4o" },
                        { value: "gemini-pro", label: "Gemini Pro" },
                      ]} />
                      <Button type="primary" icon={<SendOutlined />} onClick={handleTest} loading={testLoading}>
                        Run Test
                      </Button>
                    </Flex>

                    {testOutput && (
                      <Card size="small" style={{ borderRadius: 8, background: "#f6ffed", borderColor: "#b7eb8f" }}>
                        <Text strong style={{ fontSize: 12, display: "block", marginBottom: 8 }}>Output:</Text>
                        <pre style={{ fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
                          {testOutput}
                        </pre>
                      </Card>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      <Modal
        title="Create Prompt Template"
        open={createModalOpen}
        onOk={handleCreatePrompt}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        okText="Create"
        width={600}
      >
        <Form form={form} layout="vertical" requiredMark="optional" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Template Name" rules={[{ required: true, message: "Enter template name" }]}>
            <Input placeholder="e.g. Customer Issue Resolution" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: "Select category" }]}>
            <Select placeholder="Select category" options={[
              { value: "customer_support", label: "Customer Support" },
              { value: "data_analysis", label: "Data Analysis" },
              { value: "code_generation", label: "Code Generation" },
              { value: "content", label: "Content" },
              { value: "summarization", label: "Summarization" },
            ]} />
          </Form.Item>
          <Form.Item name="template" label="Template" rules={[{ required: true, message: "Enter template" }]} extra="Use {{variable_name}} for dynamic variables">
            <TextArea rows={8} placeholder="You are a helpful assistant. Given {{input}}, please..." style={{ fontFamily: "monospace", fontSize: 12 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PromptLibrary;
