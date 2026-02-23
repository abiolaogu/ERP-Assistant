import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Typography,
  Descriptions,
  Table,
  Tag,
  Flex,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import type { AgentRun, DiffEntry } from "@/types/assistant.types";
import { formatDate, formatDuration, formatTokens, formatCurrency } from "@/utils/formatters";

const { Text, Paragraph } = Typography;

const mockRun: AgentRun = {
  id: "r1",
  agentId: "a1",
  agentName: "Code Generator",
  status: "completed",
  trigger: "manual",
  input: "Implement user authentication module with JWT. Include login, logout, token refresh, and middleware for protected routes. Use bcrypt for password hashing and jsonwebtoken for JWT operations.",
  output: "Successfully generated 3 files:\n\n1. src/auth/authService.ts - Authentication service with login, logout, refresh token, and password hashing\n2. src/auth/authMiddleware.ts - Express middleware for JWT verification and role-based access control\n3. src/auth/authTypes.ts - TypeScript interfaces and types for auth module\n\nTotal: 168 lines added across 3 new files.",
  diffs: [
    {
      id: "d1",
      runId: "r1",
      filePath: "src/auth/authService.ts",
      changeType: "added",
      additions: 85,
      deletions: 0,
      patch: `+import bcrypt from 'bcrypt';\n+import jwt from 'jsonwebtoken';\n+import { AuthUser, TokenPayload, LoginRequest } from './authTypes';\n+\n+const JWT_SECRET = process.env.JWT_SECRET || 'secret';\n+const TOKEN_EXPIRY = '24h';\n+const REFRESH_EXPIRY = '7d';\n+\n+export class AuthService {\n+  async login(request: LoginRequest): Promise<{ accessToken: string; refreshToken: string }> {\n+    const user = await this.findUserByEmail(request.email);\n+    if (!user) throw new Error('Invalid credentials');\n+\n+    const isValid = await bcrypt.compare(request.password, user.passwordHash);\n+    if (!isValid) throw new Error('Invalid credentials');\n+\n+    const accessToken = this.generateToken(user, TOKEN_EXPIRY);\n+    const refreshToken = this.generateToken(user, REFRESH_EXPIRY);\n+    return { accessToken, refreshToken };\n+  }\n+\n+  async logout(userId: string): Promise<void> {\n+    await this.revokeTokens(userId);\n+  }\n+\n+  private generateToken(user: AuthUser, expiresIn: string): string {\n+    const payload: TokenPayload = { sub: user.id, email: user.email, roles: user.roles };\n+    return jwt.sign(payload, JWT_SECRET, { expiresIn });\n+  }\n+}`,
      status: "pending",
    },
    {
      id: "d2",
      runId: "r1",
      filePath: "src/auth/authMiddleware.ts",
      changeType: "added",
      additions: 42,
      deletions: 0,
      patch: `+import { Request, Response, NextFunction } from 'express';\n+import jwt from 'jsonwebtoken';\n+import { TokenPayload } from './authTypes';\n+\n+const JWT_SECRET = process.env.JWT_SECRET || 'secret';\n+\n+export function authenticate(req: Request, res: Response, next: NextFunction) {\n+  const token = req.headers.authorization?.replace('Bearer ', '');\n+  if (!token) return res.status(401).json({ error: 'No token provided' });\n+\n+  try {\n+    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;\n+    req.user = decoded;\n+    next();\n+  } catch {\n+    return res.status(401).json({ error: 'Invalid token' });\n+  }\n+}\n+\n+export function authorize(...roles: string[]) {\n+  return (req: Request, res: Response, next: NextFunction) => {\n+    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });\n+    if (!roles.some(role => req.user.roles.includes(role))) {\n+      return res.status(403).json({ error: 'Insufficient permissions' });\n+    }\n+    next();\n+  };\n+}`,
      status: "pending",
    },
    {
      id: "d3",
      runId: "r1",
      filePath: "src/auth/authTypes.ts",
      changeType: "added",
      additions: 41,
      deletions: 0,
      patch: `+export interface AuthUser {\n+  id: string;\n+  email: string;\n+  name: string;\n+  roles: string[];\n+  passwordHash: string;\n+}\n+\n+export interface TokenPayload {\n+  sub: string;\n+  email: string;\n+  roles: string[];\n+}\n+\n+export interface LoginRequest {\n+  email: string;\n+  password: string;\n+}`,
      status: "pending",
    },
  ],
  startedAt: "2026-02-23T10:15:00Z",
  completedAt: "2026-02-23T10:17:30Z",
  duration: 150,
  tokensUsed: 45200,
  cost: 0.18,
};

const RunShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  void id;

  const diffColumns = [
    {
      title: "File",
      dataIndex: "filePath",
      key: "filePath",
      render: (path: string) => (
        <Space>
          <FileTextOutlined style={{ color: "#0f6fa8" }} />
          <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{path}</Text>
        </Space>
      ),
    },
    {
      title: "Change",
      dataIndex: "changeType",
      key: "changeType",
      width: 100,
      render: (type: string) => (
        <Tag
          color={type === "added" ? "green" : type === "deleted" ? "red" : "blue"}
          style={{ textTransform: "capitalize", borderRadius: 4 }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: "Changes",
      key: "changes",
      width: 120,
      render: (_: unknown, record: DiffEntry) => (
        <Space>
          <Text style={{ color: "#389e0d", fontSize: 12 }}>
            <PlusOutlined style={{ fontSize: 10 }} /> {record.additions}
          </Text>
          <Text style={{ color: "#cf1322", fontSize: 12 }}>
            <MinusOutlined style={{ fontSize: 10 }} /> {record.deletions}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: DiffEntry) =>
        record.status === "pending" ? (
          <Space size={4}>
            <Button type="primary" size="small" icon={<CheckOutlined />} style={{ background: "#52c41a", borderColor: "#52c41a" }}>
              Approve
            </Button>
            <Button danger size="small" icon={<CloseOutlined />}>
              Reject
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Run: ${mockRun.agentName}`}
        subtitle={`Trigger: ${mockRun.trigger} | ${formatDate(mockRun.startedAt, "MMM DD, HH:mm")}`}
        breadcrumbs={[
          { title: "Home", href: "/" },
          { title: "Agent Runs", href: "/runs" },
          { title: mockRun.agentName },
        ]}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/runs")}>
              Back
            </Button>
            {mockRun.diffs.some((d) => d.status === "pending") && (
              <>
                <Button type="primary" icon={<CheckOutlined />} style={{ background: "#52c41a", borderColor: "#52c41a" }}>
                  Approve All
                </Button>
                <Button danger icon={<CloseOutlined />}>
                  Reject All
                </Button>
              </>
            )}
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic
              title="Status"
              valueRender={() => <StatusBadge status={mockRun.status} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic
              title="Duration"
              value={formatDuration(mockRun.duration)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic
              title="Tokens Used"
              value={formatTokens(mockRun.tokensUsed)}
              valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 10 }}>
            <Statistic
              title="Cost"
              value={formatCurrency(mockRun.cost)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#722ed1", fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Input" style={{ borderRadius: 10 }}>
            <Paragraph style={{ fontSize: 13, whiteSpace: "pre-wrap", margin: 0 }}>
              {mockRun.input}
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Output" style={{ borderRadius: 10 }}>
            <Paragraph style={{ fontSize: 13, whiteSpace: "pre-wrap", margin: 0 }}>
              {mockRun.output || "No output yet"}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card title={`Diffs (${mockRun.diffs.length} files)`} style={{ borderRadius: 10, marginBottom: 24 }}>
        <Table
          dataSource={mockRun.diffs}
          columns={diffColumns}
          rowKey="id"
          pagination={false}
          expandable={{
            expandedRowRender: (record: DiffEntry) => (
              <div
                style={{
                  background: "#1e1e1e",
                  borderRadius: 8,
                  padding: 16,
                  overflow: "auto",
                }}
              >
                <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.8 }}>
                  {record.patch.split("\n").map((line, idx) => (
                    <code
                      key={idx}
                      style={{
                        display: "block",
                        padding: "0 8px",
                        color: line.startsWith("+")
                          ? "#4caf50"
                          : line.startsWith("-")
                            ? "#f44336"
                            : "#ccc",
                        background: line.startsWith("+")
                          ? "rgba(76, 175, 80, 0.1)"
                          : line.startsWith("-")
                            ? "rgba(244, 67, 54, 0.1)"
                            : "transparent",
                      }}
                    >
                      {line}
                    </code>
                  ))}
                </pre>
              </div>
            ),
          }}
        />
      </Card>

      <Card title="Run Details" style={{ borderRadius: 10 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Agent">{mockRun.agentName}</Descriptions.Item>
          <Descriptions.Item label="Trigger">
            <Tag style={{ textTransform: "capitalize" }}>{mockRun.trigger}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Started">{formatDate(mockRun.startedAt)}</Descriptions.Item>
          <Descriptions.Item label="Completed">{formatDate(mockRun.completedAt)}</Descriptions.Item>
          <Descriptions.Item label="Duration">{formatDuration(mockRun.duration)}</Descriptions.Item>
          <Descriptions.Item label="Files Changed">{mockRun.diffs.length}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default RunShow;
