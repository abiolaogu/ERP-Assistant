import React, { useState } from "react";
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Modal,
  Space,
  Typography,
  Tag,
  Input,
  Select,
  Form,
  InputNumber,
  Upload,
  Progress,
  Tabs,
  Flex,
  Statistic,
  List,
  Divider,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  PlusOutlined,
  BookOutlined,
  UploadOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  SearchOutlined,
  DatabaseOutlined,
  InboxOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/common/KPICard";
import StatusBadge from "@/components/common/StatusBadge";
import { formatDate, formatNumber } from "@/utils/formatters";

const { Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface KBDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  chunks: number;
  uploadedAt: string;
  status: "uploading" | "processing" | "indexed" | "failed";
}

interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  documentCount: number;
  totalSize: string;
  chunkCount: number;
  lastUpdated: string;
  status: "active" | "building" | "error";
  documents: KBDocument[];
}

interface SearchResult {
  id: string;
  content: string;
  source: string;
  relevance: number;
  chunkIndex: number;
}

const mockKBs: KnowledgeBaseItem[] = [
  {
    id: "kb-001",
    name: "Company Documentation",
    description: "Internal company policies, procedures, and guidelines for all departments",
    embeddingModel: "text-embedding-3-large",
    chunkSize: 512,
    chunkOverlap: 50,
    documentCount: 45,
    totalSize: "128 MB",
    chunkCount: 3420,
    lastUpdated: "2026-02-28T08:00:00Z",
    status: "active",
    documents: [
      { id: "d1", name: "Employee Handbook 2026.pdf", type: "pdf", size: "4.2 MB", chunks: 156, uploadedAt: "2026-02-20T10:00:00Z", status: "indexed" },
      { id: "d2", name: "Security Policy.docx", type: "docx", size: "1.8 MB", chunks: 72, uploadedAt: "2026-02-18T14:00:00Z", status: "indexed" },
      { id: "d3", name: "Onboarding Guide.pdf", type: "pdf", size: "2.5 MB", chunks: 98, uploadedAt: "2026-02-15T09:00:00Z", status: "indexed" },
      { id: "d4", name: "Benefits Overview.pdf", type: "pdf", size: "1.2 MB", chunks: 45, uploadedAt: "2026-02-22T11:00:00Z", status: "indexed" },
      { id: "d5", name: "Code of Conduct.txt", type: "txt", size: "0.3 MB", chunks: 12, uploadedAt: "2026-02-25T10:00:00Z", status: "processing" },
    ],
  },
  {
    id: "kb-002",
    name: "Product Knowledge",
    description: "Product features, specifications, pricing, and competitive analysis documentation",
    embeddingModel: "text-embedding-3-small",
    chunkSize: 256,
    chunkOverlap: 30,
    documentCount: 32,
    totalSize: "85 MB",
    chunkCount: 2180,
    lastUpdated: "2026-02-27T16:00:00Z",
    status: "active",
    documents: [
      { id: "d6", name: "Product Catalog Q1 2026.pdf", type: "pdf", size: "8.5 MB", chunks: 320, uploadedAt: "2026-02-10T10:00:00Z", status: "indexed" },
      { id: "d7", name: "Feature Comparison.xlsx", type: "xlsx", size: "0.5 MB", chunks: 18, uploadedAt: "2026-02-12T14:00:00Z", status: "indexed" },
      { id: "d8", name: "Pricing Matrix.pdf", type: "pdf", size: "0.8 MB", chunks: 24, uploadedAt: "2026-02-15T10:00:00Z", status: "indexed" },
    ],
  },
  {
    id: "kb-003",
    name: "Technical Guides",
    description: "API documentation, architecture decisions, deployment guides, and troubleshooting",
    embeddingModel: "text-embedding-3-large",
    chunkSize: 1024,
    chunkOverlap: 100,
    documentCount: 78,
    totalSize: "210 MB",
    chunkCount: 5640,
    lastUpdated: "2026-02-28T10:00:00Z",
    status: "active",
    documents: [
      { id: "d9", name: "API Reference v3.pdf", type: "pdf", size: "12.4 MB", chunks: 580, uploadedAt: "2026-02-25T10:00:00Z", status: "indexed" },
      { id: "d10", name: "Architecture Decision Records.md", type: "md", size: "0.4 MB", chunks: 32, uploadedAt: "2026-02-20T10:00:00Z", status: "indexed" },
      { id: "d11", name: "Deployment Runbook.pdf", type: "pdf", size: "3.2 MB", chunks: 128, uploadedAt: "2026-02-22T14:00:00Z", status: "indexed" },
      { id: "d12", name: "Troubleshooting Guide.docx", type: "docx", size: "2.1 MB", chunks: 86, uploadedAt: "2026-02-18T10:00:00Z", status: "indexed" },
    ],
  },
  {
    id: "kb-004",
    name: "Customer Support FAQ",
    description: "Frequently asked questions, ticket resolution templates, and escalation procedures",
    embeddingModel: "text-embedding-3-small",
    chunkSize: 256,
    chunkOverlap: 25,
    documentCount: 120,
    totalSize: "56 MB",
    chunkCount: 8920,
    lastUpdated: "2026-02-28T06:00:00Z",
    status: "building",
    documents: [
      { id: "d13", name: "FAQ Database.json", type: "json", size: "2.8 MB", chunks: 450, uploadedAt: "2026-02-27T10:00:00Z", status: "indexed" },
      { id: "d14", name: "Ticket Templates.docx", type: "docx", size: "1.5 MB", chunks: 64, uploadedAt: "2026-02-26T14:00:00Z", status: "indexed" },
      { id: "d15", name: "Escalation Procedures.pdf", type: "pdf", size: "0.9 MB", chunks: 38, uploadedAt: "2026-02-28T06:00:00Z", status: "uploading" },
    ],
  },
  {
    id: "kb-005",
    name: "Sales Playbook",
    description: "Sales scripts, objection handling, case studies, and competitive intelligence",
    embeddingModel: "text-embedding-3-small",
    chunkSize: 512,
    chunkOverlap: 50,
    documentCount: 28,
    totalSize: "42 MB",
    chunkCount: 1890,
    lastUpdated: "2026-02-25T12:00:00Z",
    status: "error",
    documents: [
      { id: "d16", name: "Sales Scripts.pdf", type: "pdf", size: "3.2 MB", chunks: 0, uploadedAt: "2026-02-25T12:00:00Z", status: "failed" },
    ],
  },
];

const mockSearchResults: SearchResult[] = [
  { id: "sr1", content: "The JWT token should be refreshed 5 minutes before expiry. Use the /auth/refresh endpoint with the current refresh token stored in an HTTP-only cookie.", source: "API Reference v3.pdf", relevance: 0.95, chunkIndex: 142 },
  { id: "sr2", content: "Authentication flow: 1) User submits credentials 2) Server validates and issues access + refresh tokens 3) Client stores access token in memory 4) Refresh token set as HTTP-only cookie.", source: "Architecture Decision Records.md", relevance: 0.89, chunkIndex: 12 },
  { id: "sr3", content: "For multi-tenant authentication, each tenant has a separate auth configuration stored in the tenants table. The tenant_id is embedded in the JWT payload for authorization.", source: "Deployment Runbook.pdf", relevance: 0.82, chunkIndex: 45 },
  { id: "sr4", content: "Rate limiting is applied to authentication endpoints: 5 login attempts per minute per IP, 10 token refresh requests per minute per user.", source: "Security Policy.docx", relevance: 0.76, chunkIndex: 28 },
];

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FilePdfOutlined style={{ color: "#ff4d4f" }} />,
  docx: <FileWordOutlined style={{ color: "#1677ff" }} />,
  txt: <FileTextOutlined style={{ color: "#8c8c8c" }} />,
  md: <FileTextOutlined style={{ color: "#595959" }} />,
  json: <FileTextOutlined style={{ color: "#fa8c16" }} />,
  xlsx: <FileTextOutlined style={{ color: "#52c41a" }} />,
};

const KnowledgeBase: React.FC = () => {
  const [selectedKB, setSelectedKB] = useState<KnowledgeBaseItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [form] = Form.useForm();

  const totalDocs = mockKBs.reduce((s, kb) => s + kb.documentCount, 0);
  const totalChunks = mockKBs.reduce((s, kb) => s + kb.chunkCount, 0);

  const handleCreateKB = () => {
    form.validateFields().then((values) => {
      console.log("Creating KB:", values);
      message.success("Knowledge base created successfully");
      setCreateModalOpen(false);
      form.resetFields();
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setShowSearchResults(true);
  };

  const kbStatusColors: Record<string, string> = {
    active: "success",
    building: "processing",
    error: "error",
  };

  const docStatusColors: Record<string, string> = {
    uploading: "processing",
    processing: "warning",
    indexed: "success",
    failed: "error",
  };

  const kbColumns = [
    {
      title: "Knowledge Base",
      key: "name",
      render: (_: unknown, record: KnowledgeBaseItem) => (
        <div>
          <Button type="link" style={{ padding: 0, fontSize: 13, fontWeight: 600 }} onClick={() => setSelectedKB(record)}>
            {record.name}
          </Button>
          <br />
          <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{record.description.substring(0, 70)}...</Text>
        </div>
      ),
    },
    {
      title: "Documents",
      dataIndex: "documentCount",
      key: "documentCount",
      width: 100,
      align: "center" as const,
      render: (count: number) => <Text style={{ fontSize: 13, fontWeight: 600 }}>{count}</Text>,
    },
    {
      title: "Size",
      dataIndex: "totalSize",
      key: "totalSize",
      width: 90,
      render: (size: string) => <Text style={{ fontSize: 12 }}>{size}</Text>,
    },
    {
      title: "Chunks",
      dataIndex: "chunkCount",
      key: "chunkCount",
      width: 90,
      render: (count: number) => <Text style={{ fontSize: 12, fontFamily: "monospace" }}>{formatNumber(count)}</Text>,
    },
    {
      title: "Embedding Model",
      dataIndex: "embeddingModel",
      key: "embeddingModel",
      width: 190,
      render: (model: string) => <Tag style={{ borderRadius: 4, fontFamily: "monospace", fontSize: 10 }}>{model}</Tag>,
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      width: 140,
      render: (date: string) => <Text style={{ fontSize: 12 }}>{formatDate(date, "MMM DD, HH:mm")}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => <StatusBadge status={status} colorMap={kbStatusColors} />,
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_: unknown, record: KnowledgeBaseItem) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setSelectedKB(record)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => console.log("Delete:", record.id)} />
        </Space>
      ),
    },
  ];

  const docColumns = [
    {
      title: "Document",
      key: "name",
      render: (_: unknown, record: KBDocument) => (
        <Space>
          {fileTypeIcons[record.type] || <FileTextOutlined />}
          <Text style={{ fontSize: 13 }}>{record.name}</Text>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 70,
      render: (type: string) => <Tag style={{ borderRadius: 4, fontSize: 10, textTransform: "uppercase" }}>{type}</Tag>,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 80,
      render: (size: string) => <Text style={{ fontSize: 12 }}>{size}</Text>,
    },
    {
      title: "Chunks",
      dataIndex: "chunks",
      key: "chunks",
      width: 70,
      align: "center" as const,
      render: (chunks: number) => <Text style={{ fontSize: 12 }}>{chunks}</Text>,
    },
    {
      title: "Uploaded",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      width: 130,
      render: (date: string) => <Text style={{ fontSize: 12 }}>{formatDate(date, "MMM DD, HH:mm")}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: string) => {
        if (status === "uploading" || status === "processing") {
          return (
            <Space>
              <StatusBadge status={status} colorMap={docStatusColors} />
              <Progress percent={status === "uploading" ? 45 : 78} size="small" style={{ width: 60 }} showInfo={false} />
            </Space>
          );
        }
        return <StatusBadge status={status} colorMap={docStatusColors} />;
      },
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_: unknown, record: KBDocument) => (
        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => console.log("Delete doc:", record.id)} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Knowledge Base Manager"
        subtitle="Manage document collections for AI agent context and retrieval"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Knowledge Base" }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            Create Knowledge Base
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Knowledge Bases" value={mockKBs.length} prefix={<BookOutlined />} borderColor="#0f6fa8" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Total Documents" value={totalDocs} prefix={<FileTextOutlined />} trend={8.3} trendLabel="this week" borderColor="#52c41a" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Total Chunks" value={formatNumber(totalChunks)} prefix={<DatabaseOutlined />} trend={12.5} trendLabel="this week" borderColor="#fa8c16" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Avg Chunk Size" value="512 tokens" prefix={<DatabaseOutlined />} borderColor="#722ed1" />
        </Col>
      </Row>

      {selectedKB ? (
        <div>
          <Button style={{ marginBottom: 16 }} onClick={() => setSelectedKB(null)}>
            Back to All Knowledge Bases
          </Button>
          <Card style={{ borderRadius: 10, marginBottom: 16 }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <div>
                <Text style={{ fontSize: 18, fontWeight: 700, display: "block" }}>{selectedKB.name}</Text>
                <Text style={{ fontSize: 13, color: "#8c8c8c" }}>{selectedKB.description}</Text>
              </div>
              <StatusBadge status={selectedKB.status} colorMap={kbStatusColors} />
            </Flex>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic title="Documents" value={selectedKB.documentCount} valueStyle={{ fontWeight: 700, fontSize: 20 }} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="Total Size" value={selectedKB.totalSize} valueStyle={{ fontWeight: 700, fontSize: 20 }} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="Chunks" value={selectedKB.chunkCount} valueStyle={{ fontWeight: 700, fontSize: 20 }} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="Chunk Size" value={selectedKB.chunkSize} suffix="tokens" valueStyle={{ fontWeight: 700, fontSize: 20 }} />
              </Col>
            </Row>
          </Card>

          <Tabs
            defaultActiveKey="documents"
            items={[
              {
                key: "documents",
                label: "Documents",
                children: (
                  <Card style={{ borderRadius: 10 }}>
                    <Dragger
                      multiple
                      showUploadList={false}
                      beforeUpload={() => { message.info("Upload simulated"); return false; }}
                      style={{ marginBottom: 16 }}
                    >
                      <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                      <p className="ant-upload-text">Click or drag files to upload</p>
                      <p className="ant-upload-hint">Supports PDF, DOCX, TXT, MD, JSON, XLSX</p>
                    </Dragger>
                    <Table dataSource={selectedKB.documents} columns={docColumns} rowKey="id" pagination={false} size="small" />
                  </Card>
                ),
              },
              {
                key: "search",
                label: "Search",
                children: (
                  <Card style={{ borderRadius: 10 }}>
                    <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
                      <Input
                        placeholder="Search within this knowledge base..."
                        prefix={<SearchOutlined />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onPressEnter={handleSearch}
                      />
                      <Button type="primary" onClick={handleSearch}>Search</Button>
                    </Space.Compact>

                    {showSearchResults && (
                      <List
                        dataSource={mockSearchResults}
                        renderItem={(item) => (
                          <List.Item>
                            <div style={{ width: "100%" }}>
                              <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                                <Space>
                                  <Tag color="blue" style={{ borderRadius: 4, fontSize: 11 }}>
                                    Relevance: {(item.relevance * 100).toFixed(0)}%
                                  </Tag>
                                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Chunk #{item.chunkIndex}</Text>
                                </Space>
                                <Text style={{ fontSize: 11, color: "#0f6fa8", fontWeight: 500 }}>{item.source}</Text>
                              </Flex>
                              <Paragraph style={{ fontSize: 12, margin: 0, color: "#595959", lineHeight: 1.6 }}>
                                {item.content}
                              </Paragraph>
                            </div>
                          </List.Item>
                        )}
                      />
                    )}
                  </Card>
                ),
              },
              {
                key: "stats",
                label: "Stats",
                children: (
                  <Card style={{ borderRadius: 10 }}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Card style={{ borderRadius: 8, textAlign: "center", background: "#f0f5ff" }}>
                          <Statistic title="Total Documents" value={selectedKB.documentCount} valueStyle={{ fontWeight: 700 }} />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card style={{ borderRadius: 8, textAlign: "center", background: "#f6ffed" }}>
                          <Statistic title="Total Chunks" value={selectedKB.chunkCount} valueStyle={{ fontWeight: 700 }} />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card style={{ borderRadius: 8, textAlign: "center", background: "#fff7e6" }}>
                          <Statistic title="Chunk Size" value={selectedKB.chunkSize} suffix="tokens" valueStyle={{ fontWeight: 700 }} />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card style={{ borderRadius: 8, textAlign: "center", background: "#f9f0ff" }}>
                          <Statistic title="Embedding Dims" value={selectedKB.embeddingModel.includes("large") ? 3072 : 1536} valueStyle={{ fontWeight: 700 }} />
                        </Card>
                      </Col>
                    </Row>
                    <Divider />
                    <Text strong style={{ display: "block", marginBottom: 8 }}>Configuration</Text>
                    <Flex gap={24}>
                      <Space orientation="vertical" size={2}>
                        <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Embedding Model</Text>
                        <Tag style={{ fontFamily: "monospace" }}>{selectedKB.embeddingModel}</Tag>
                      </Space>
                      <Space orientation="vertical" size={2}>
                        <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Chunk Overlap</Text>
                        <Text strong>{selectedKB.chunkOverlap} tokens</Text>
                      </Space>
                      <Space orientation="vertical" size={2}>
                        <Text style={{ fontSize: 11, color: "#8c8c8c" }}>Last Updated</Text>
                        <Text strong>{formatDate(selectedKB.lastUpdated, "MMM DD, HH:mm")}</Text>
                      </Space>
                    </Flex>
                  </Card>
                ),
              },
            ]}
          />
        </div>
      ) : (
        <Card style={{ borderRadius: 10 }}>
          <Table dataSource={mockKBs} columns={kbColumns} rowKey="id" pagination={{ pageSize: 10, showTotal: (total) => `${total} knowledge bases` }} />
        </Card>
      )}

      <Modal
        title="Create Knowledge Base"
        open={createModalOpen}
        onOk={handleCreateKB}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        okText="Create"
        width={520}
      >
        <Form form={form} layout="vertical" requiredMark="optional" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Enter KB name" }]}>
            <Input placeholder="e.g. Product Documentation" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Describe the knowledge base..." />
          </Form.Item>
          <Form.Item name="embeddingModel" label="Embedding Model" initialValue="text-embedding-3-small">
            <Select options={[
              { value: "text-embedding-3-small", label: "text-embedding-3-small (1536 dims)" },
              { value: "text-embedding-3-large", label: "text-embedding-3-large (3072 dims)" },
              { value: "text-embedding-ada-002", label: "text-embedding-ada-002 (1536 dims)" },
            ]} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="chunkSize" label="Chunk Size (tokens)" initialValue={512}>
                <InputNumber min={128} max={2048} step={128} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="chunkOverlap" label="Chunk Overlap (tokens)" initialValue={50}>
                <InputNumber min={0} max={256} step={10} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeBase;
