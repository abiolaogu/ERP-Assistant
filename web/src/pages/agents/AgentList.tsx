import React from "react";
import { Row, Col, Card, Tag, Button, Space, Typography, Flex } from "antd";
import {
  PlusOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CodeOutlined,
  BugOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import type { Agent } from "@/types/assistant.types";
import { formatDate } from "@/utils/formatters";
import { AGENT_TYPE_COLORS } from "@/utils/constants";

const { Text, Paragraph } = Typography;

const agentTypeIcons: Record<string, React.ReactNode> = {
  coding: <CodeOutlined />,
  review: <SearchOutlined />,
  testing: <BugOutlined />,
  documentation: <FileTextOutlined />,
};

const mockAgents: Agent[] = [
  { id: "a1", name: "Code Generator", description: "Generates production-ready TypeScript/React code from specifications. Supports component creation, API endpoints, and database models.", type: "coding", status: "idle", model: "gpt-4o", capabilities: ["typescript", "react", "node.js", "graphql"], createdAt: "2026-01-15T10:00:00Z", lastRunAt: "2026-02-23T10:15:00Z" },
  { id: "a2", name: "Code Reviewer", description: "Performs automated code reviews on pull requests. Checks for security vulnerabilities, performance issues, and code quality.", type: "review", status: "running", model: "claude-3.5-sonnet", capabilities: ["security-audit", "performance", "best-practices", "refactoring"], createdAt: "2026-01-15T10:00:00Z", lastRunAt: "2026-02-23T10:20:00Z" },
  { id: "a3", name: "Test Writer", description: "Generates comprehensive unit and integration tests. Supports Jest, Vitest, and Playwright for end-to-end testing.", type: "testing", status: "idle", model: "gpt-4o", capabilities: ["jest", "vitest", "playwright", "test-coverage"], createdAt: "2026-01-20T10:00:00Z", lastRunAt: "2026-02-23T09:45:00Z" },
  { id: "a4", name: "Documentation Generator", description: "Creates and updates project documentation including API docs, README files, and code comments.", type: "documentation", status: "idle", model: "gpt-4o-mini", capabilities: ["markdown", "openapi", "jsdoc", "readme"], createdAt: "2026-01-25T10:00:00Z", lastRunAt: "2026-02-22T16:30:00Z" },
  { id: "a5", name: "Bug Fixer", description: "Analyzes error reports and stack traces to identify and fix bugs automatically.", type: "coding", status: "paused", model: "claude-3.5-sonnet", capabilities: ["debugging", "error-analysis", "hotfix", "regression-check"], createdAt: "2026-02-01T10:00:00Z", lastRunAt: "2026-02-22T14:00:00Z" },
  { id: "a6", name: "Security Scanner", description: "Scans code for security vulnerabilities including OWASP Top 10, dependency audits, and credential leaks.", type: "review", status: "error", model: "gpt-4o", capabilities: ["owasp", "dependency-audit", "credential-scan", "cve-check"], createdAt: "2026-02-05T10:00:00Z", lastRunAt: "2026-02-23T08:00:00Z" },
  { id: "a7", name: "API Test Generator", description: "Creates API integration tests from OpenAPI specifications and GraphQL schemas.", type: "testing", status: "idle", model: "gpt-4o-mini", capabilities: ["rest-api", "graphql", "load-testing", "contract-testing"], createdAt: "2026-02-10T10:00:00Z", lastRunAt: "2026-02-22T11:00:00Z" },
  { id: "a8", name: "Refactoring Assistant", description: "Identifies code smells and suggests refactoring improvements. Supports automated safe refactoring.", type: "coding", status: "idle", model: "claude-3.5-sonnet", capabilities: ["code-smells", "solid-principles", "design-patterns", "migration"], createdAt: "2026-02-12T10:00:00Z", lastRunAt: "2026-02-21T15:30:00Z" },
];

const AgentList: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Agents"
        subtitle="Manage your AI coding assistants"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Agents" }]}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/agents/new")}
          >
            New Agent
          </Button>
        }
      />

      <Row gutter={[16, 16]}>
        {mockAgents.map((agent) => (
          <Col key={agent.id} xs={24} sm={12} lg={8} xl={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, height: "100%" }}
              bodyStyle={{ padding: 20, display: "flex", flexDirection: "column", height: "100%" }}
              onClick={() => navigate(`/agents/${agent.id}`)}
            >
              <Flex justify="space-between" align="flex-start" style={{ marginBottom: 12 }}>
                <Space size={8}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "#f0f5ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      color: "#0f6fa8",
                    }}
                  >
                    {agentTypeIcons[agent.type]}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, display: "block" }}>
                      {agent.name}
                    </Text>
                    <Tag
                      color={AGENT_TYPE_COLORS[agent.type]}
                      style={{ borderRadius: 4, fontSize: 11, marginTop: 2 }}
                    >
                      {agent.type}
                    </Tag>
                  </div>
                </Space>
                <StatusBadge status={agent.status} />
              </Flex>

              <Paragraph
                style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 12, flex: 1 }}
                ellipsis={{ rows: 2 }}
              >
                {agent.description}
              </Paragraph>

              <div style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: "#8c8c8c", display: "block", marginBottom: 6 }}>
                  Model: {agent.model}
                </Text>
                <Flex wrap="wrap" gap={4}>
                  {agent.capabilities.slice(0, 3).map((cap) => (
                    <Tag
                      key={cap}
                      style={{
                        borderRadius: 4,
                        fontSize: 10,
                        padding: "0 6px",
                        margin: 0,
                      }}
                    >
                      {cap}
                    </Tag>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Tag style={{ borderRadius: 4, fontSize: 10, padding: "0 6px", margin: 0 }}>
                      +{agent.capabilities.length - 3}
                    </Tag>
                  )}
                </Flex>
              </div>

              <Flex justify="space-between" align="center" style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
                  Last run: {agent.lastRunAt ? formatDate(agent.lastRunAt, "MMM DD, HH:mm") : "Never"}
                </Text>
                <Space size={4}>
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/agents/${agent.id}`);
                    }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    style={{ color: "#52c41a" }}
                    disabled={agent.status === "running" || agent.status === "error"}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Run agent:", agent.id);
                    }}
                  />
                </Space>
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AgentList;
