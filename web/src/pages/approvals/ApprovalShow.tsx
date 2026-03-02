import React from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Descriptions,
  Tag,
  Table,
  Input,
  Flex,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import type { Approval, DiffEntry } from "@/types/assistant.types";
import { formatDate } from "@/utils/formatters";
import { APPROVAL_TYPE_COLORS } from "@/utils/constants";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const mockApproval: Approval = {
  id: "ap1",
  runId: "r1",
  agentName: "Code Generator",
  requestedBy: "System",
  type: "code_change",
  status: "pending",
  description: "Generated user authentication module with JWT login, logout, and middleware. Changes include 3 new files in src/auth/. The implementation follows the existing project patterns and includes proper error handling, type safety, and bcrypt password hashing.",
  diffCount: 3,
  createdAt: "2026-02-23T10:17:30Z",
};

const mockDiffs: DiffEntry[] = [
  {
    id: "d1",
    runId: "r1",
    filePath: "src/auth/authService.ts",
    changeType: "added",
    additions: 85,
    deletions: 0,
    patch: `+import bcrypt from 'bcrypt';
+import jwt from 'jsonwebtoken';
+import { AuthUser, TokenPayload, LoginRequest } from './authTypes';
+
+const JWT_SECRET = process.env.JWT_SECRET || 'secret';
+const TOKEN_EXPIRY = '24h';
+
+export class AuthService {
+  async login(request: LoginRequest) {
+    const user = await this.findUserByEmail(request.email);
+    if (!user) throw new Error('Invalid credentials');
+
+    const isValid = await bcrypt.compare(request.password, user.passwordHash);
+    if (!isValid) throw new Error('Invalid credentials');
+
+    return { accessToken: this.generateToken(user) };
+  }
+
+  private generateToken(user: AuthUser): string {
+    const payload: TokenPayload = { sub: user.id, email: user.email };
+    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
+  }
+}`,
    status: "pending",
  },
  {
    id: "d2",
    runId: "r1",
    filePath: "src/auth/authMiddleware.ts",
    changeType: "added",
    additions: 42,
    deletions: 0,
    patch: `+import { Request, Response, NextFunction } from 'express';
+import jwt from 'jsonwebtoken';
+
+export function authenticate(req: Request, res: Response, next: NextFunction) {
+  const token = req.headers.authorization?.replace('Bearer ', '');
+  if (!token) return res.status(401).json({ error: 'No token' });
+
+  try {
+    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
+    next();
+  } catch {
+    return res.status(401).json({ error: 'Invalid token' });
+  }
+}`,
    status: "pending",
  },
  {
    id: "d3",
    runId: "r1",
    filePath: "src/auth/authTypes.ts",
    changeType: "added",
    additions: 41,
    deletions: 0,
    patch: `+export interface AuthUser {
+  id: string;
+  email: string;
+  name: string;
+  roles: string[];
+  passwordHash: string;
+}
+
+export interface TokenPayload {
+  sub: string;
+  email: string;
+}
+
+export interface LoginRequest {
+  email: string;
+  password: string;
+}`,
    status: "pending",
  },
];

const ApprovalShow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comment, setComment] = React.useState("");

  void id;

  return (
    <div>
      <PageHeader
        title={`Approval: ${mockApproval.agentName}`}
        subtitle={`Requested ${formatDate(mockApproval.createdAt, "MMM DD, HH:mm")}`}
        breadcrumbs={[
          { title: "Home", href: "/" },
          { title: "Approvals", href: "/approvals" },
          { title: mockApproval.agentName },
        ]}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/approvals")}>
              Back
            </Button>
          </Space>
        }
      />

      {mockApproval.status === "pending" && (
        <Alert
          message="This approval is pending review"
          description="Review the changes below and approve or reject the request."
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 10 }}
        />
      )}

      <Card title="Approval Details" style={{ borderRadius: 10, marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Agent">{mockApproval.agentName}</Descriptions.Item>
          <Descriptions.Item label="Type">
            <Tag
              color={APPROVAL_TYPE_COLORS[mockApproval.type]}
              style={{ textTransform: "capitalize", borderRadius: 4 }}
            >
              {mockApproval.type.replace(/_/g, " ")}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <StatusBadge status={mockApproval.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Requested By">{mockApproval.requestedBy}</Descriptions.Item>
          <Descriptions.Item label="Files Changed">{mockApproval.diffCount}</Descriptions.Item>
          <Descriptions.Item label="Run ID">
            <Text style={{ fontFamily: "monospace" }}>{mockApproval.runId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            <Paragraph style={{ margin: 0, fontSize: 13 }}>{mockApproval.description}</Paragraph>
          </Descriptions.Item>
          {mockApproval.reviewedBy && (
            <>
              <Descriptions.Item label="Reviewed By">{mockApproval.reviewedBy}</Descriptions.Item>
              <Descriptions.Item label="Reviewed At">{formatDate(mockApproval.reviewedAt)}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      <Card title={`Associated Diffs (${mockDiffs.length})`} style={{ borderRadius: 10, marginBottom: 24 }}>
        <Space orientation="vertical" style={{ width: "100%" }} size={16}>
          {mockDiffs.map((diff) => (
            <Card
              key={diff.id}
              type="inner"
              size="small"
              title={
                <Flex justify="space-between" align="center">
                  <Space>
                    <FileTextOutlined style={{ color: "#0f6fa8" }} />
                    <Text style={{ fontFamily: "monospace", fontSize: 12 }}>{diff.filePath}</Text>
                    <Tag
                      color={diff.changeType === "added" ? "green" : diff.changeType === "deleted" ? "red" : "blue"}
                      style={{ textTransform: "capitalize", borderRadius: 4 }}
                    >
                      {diff.changeType}
                    </Tag>
                  </Space>
                  <Space>
                    <Text style={{ color: "#389e0d", fontSize: 12 }}>
                      <PlusOutlined style={{ fontSize: 10 }} /> {diff.additions}
                    </Text>
                    <Text style={{ color: "#cf1322", fontSize: 12 }}>
                      <MinusOutlined style={{ fontSize: 10 }} /> {diff.deletions}
                    </Text>
                  </Space>
                </Flex>
              }
            >
              <div
                style={{
                  background: "#1e1e1e",
                  borderRadius: 8,
                  padding: 12,
                  overflow: "auto",
                  maxHeight: 300,
                }}
              >
                <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.8 }}>
                  {diff.patch.split("\n").map((line, idx) => {
                    let bgColor = "transparent";
                    let textColor = "#d4d4d4";
                    let borderLeft = "3px solid transparent";

                    if (line.startsWith("+")) {
                      bgColor = "rgba(76, 175, 80, 0.12)";
                      textColor = "#4caf50";
                      borderLeft = "3px solid #4caf50";
                    } else if (line.startsWith("-")) {
                      bgColor = "rgba(244, 67, 54, 0.12)";
                      textColor = "#f44336";
                      borderLeft = "3px solid #f44336";
                    }

                    return (
                      <code
                        key={idx}
                        style={{
                          display: "block",
                          padding: "1px 8px",
                          color: textColor,
                          background: bgColor,
                          borderLeft,
                        }}
                      >
                        {line}
                      </code>
                    );
                  })}
                </pre>
              </div>
            </Card>
          ))}
        </Space>
      </Card>

      {mockApproval.status === "pending" && (
        <Card title="Review Decision" style={{ borderRadius: 10 }}>
          <Space orientation="vertical" style={{ width: "100%" }} size={16}>
            <div>
              <Text style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                Comment (optional)
              </Text>
              <TextArea
                rows={3}
                placeholder="Add a review comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <Flex gap={12}>
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
              >
                Approve Changes
              </Button>
              <Button danger size="large" icon={<CloseOutlined />}>
                Reject Changes
              </Button>
            </Flex>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default ApprovalShow;
