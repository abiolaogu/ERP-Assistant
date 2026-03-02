import React, { useState } from "react";
import { Card, Button, Space, Typography, Tag, Flex, Empty, Select, Input } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
  PlusOutlined,
  MinusOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import type { DiffEntry } from "@/types/assistant.types";

const { Text } = Typography;
const { Search } = Input;

const mockDiffs: (DiffEntry & { agentName: string })[] = [
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
+const REFRESH_EXPIRY = '7d';
+
+export class AuthService {
+  async login(request: LoginRequest): Promise<{ accessToken: string; refreshToken: string }> {
+    const user = await this.findUserByEmail(request.email);
+    if (!user) throw new Error('Invalid credentials');
+
+    const isValid = await bcrypt.compare(request.password, user.passwordHash);
+    if (!isValid) throw new Error('Invalid credentials');
+
+    const accessToken = this.generateToken(user, TOKEN_EXPIRY);
+    const refreshToken = this.generateToken(user, REFRESH_EXPIRY);
+    return { accessToken, refreshToken };
+  }
+
+  async logout(userId: string): Promise<void> {
+    await this.revokeTokens(userId);
+  }
+
+  private generateToken(user: AuthUser, expiresIn: string): string {
+    const payload: TokenPayload = { sub: user.id, email: user.email, roles: user.roles };
+    return jwt.sign(payload, JWT_SECRET, { expiresIn });
+  }
+}`,
    status: "pending",
    agentName: "Code Generator",
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
+import { TokenPayload } from './authTypes';
+
+const JWT_SECRET = process.env.JWT_SECRET || 'secret';
+
+export function authenticate(req: Request, res: Response, next: NextFunction) {
+  const token = req.headers.authorization?.replace('Bearer ', '');
+  if (!token) return res.status(401).json({ error: 'No token provided' });
+
+  try {
+    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
+    req.user = decoded;
+    next();
+  } catch {
+    return res.status(401).json({ error: 'Invalid token' });
+  }
+}
+
+export function authorize(...roles: string[]) {
+  return (req: Request, res: Response, next: NextFunction) => {
+    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
+    if (!roles.some(role => req.user.roles.includes(role))) {
+      return res.status(403).json({ error: 'Insufficient permissions' });
+    }
+    next();
+  };
+}`,
    status: "pending",
    agentName: "Code Generator",
  },
  {
    id: "d3",
    runId: "r3",
    filePath: "tests/payment.test.ts",
    changeType: "added",
    additions: 120,
    deletions: 0,
    patch: `+import { describe, it, expect, beforeEach, vi } from 'vitest';
+import { PaymentService } from '../src/services/PaymentService';
+
+describe('PaymentService', () => {
+  let service: PaymentService;
+
+  beforeEach(() => {
+    service = new PaymentService();
+  });
+
+  describe('processPayment', () => {
+    it('should process a valid payment', async () => {
+      const result = await service.processPayment({
+        amount: 100,
+        currency: 'USD',
+        customerId: 'cus_123',
+      });
+      expect(result.status).toBe('succeeded');
+    });
+
+    it('should reject payment with invalid amount', async () => {
+      await expect(
+        service.processPayment({ amount: -1, currency: 'USD', customerId: 'cus_123' })
+      ).rejects.toThrow('Invalid amount');
+    });
+  });
+});`,
    status: "pending",
    agentName: "Test Writer",
  },
  {
    id: "d5",
    runId: "r6",
    filePath: "src/services/OrderService.ts",
    changeType: "modified",
    additions: 5,
    deletions: 2,
    patch: ` export class OrderService {
   calculateTotal(items: OrderItem[]): number {
-    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
+    if (!items || items.length === 0) return 0;
+    return items.reduce((sum, item) => {
+      const price = item.price ?? 0;
+      const quantity = item.quantity ?? 0;
+      return sum + price * quantity;
+    }, 0);
   }
 }`,
    status: "pending",
    agentName: "Bug Fixer",
  },
];

const DiffReview: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState("");

  const filteredDiffs = mockDiffs.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false;
    if (searchText && !d.filePath.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const pendingCount = mockDiffs.filter((d) => d.status === "pending").length;

  return (
    <div>
      <PageHeader
        title="Diff Review"
        subtitle={`${pendingCount} pending review${pendingCount !== 1 ? "s" : ""}`}
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Diff Review" }]}
        extra={
          pendingCount > 0 ? (
            <Space>
              <Button type="primary" icon={<CheckOutlined />} style={{ background: "#52c41a", borderColor: "#52c41a" }}>
                Approve All ({pendingCount})
              </Button>
              <Button danger icon={<CloseOutlined />}>
                Reject All
              </Button>
            </Space>
          ) : undefined
        }
      />

      <Flex gap={12} style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search by file path..."
          style={{ width: 300 }}
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select
          placeholder="Filter by status"
          style={{ width: 160 }}
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
          ]}
          suffixIcon={<FilterOutlined />}
        />
      </Flex>

      {filteredDiffs.length === 0 ? (
        <Card style={{ borderRadius: 10, textAlign: "center", padding: 40 }}>
          <Empty description="No diffs to review" />
        </Card>
      ) : (
        <Space orientation="vertical" style={{ width: "100%" }} size={16}>
          {filteredDiffs.map((diff) => (
            <Card
              key={diff.id}
              style={{ borderRadius: 10 }}
              title={
                <Flex justify="space-between" align="center">
                  <Space>
                    <FileTextOutlined style={{ color: "#0f6fa8" }} />
                    <Text style={{ fontFamily: "monospace", fontSize: 13 }}>
                      {diff.filePath}
                    </Text>
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
                    <StatusBadge status={diff.status} />
                  </Space>
                </Flex>
              }
              extra={
                diff.status === "pending" ? (
                  <Space size={4}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      style={{ background: "#52c41a", borderColor: "#52c41a" }}
                    >
                      Approve
                    </Button>
                    <Button danger size="small" icon={<CloseOutlined />}>
                      Reject
                    </Button>
                  </Space>
                ) : undefined
              }
            >
              <Text style={{ fontSize: 11, color: "#8c8c8c", display: "block", marginBottom: 8 }}>
                Agent: {diff.agentName} | Run: {diff.runId}
              </Text>
              <div
                style={{
                  background: "#1e1e1e",
                  borderRadius: 8,
                  padding: 16,
                  overflow: "auto",
                  maxHeight: 400,
                }}
              >
                <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.8 }}>
                  {diff.patch.split("\n").map((line, idx) => {
                    let bgColor = "transparent";
                    let textColor = "#d4d4d4";

                    if (line.startsWith("+")) {
                      bgColor = "rgba(76, 175, 80, 0.12)";
                      textColor = "#4caf50";
                    } else if (line.startsWith("-")) {
                      bgColor = "rgba(244, 67, 54, 0.12)";
                      textColor = "#f44336";
                    }

                    return (
                      <code
                        key={idx}
                        style={{
                          display: "block",
                          padding: "1px 8px",
                          color: textColor,
                          background: bgColor,
                          borderLeft: line.startsWith("+")
                            ? "3px solid #4caf50"
                            : line.startsWith("-")
                              ? "3px solid #f44336"
                              : "3px solid transparent",
                        }}
                      >
                        <span style={{ display: "inline-block", width: 32, color: "#666", userSelect: "none" }}>
                          {idx + 1}
                        </span>
                        {line}
                      </code>
                    );
                  })}
                </pre>
              </div>
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
};

export default DiffReview;
