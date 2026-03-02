import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Typography,
  Tag,
  Rate,
  Space,
  Flex,
  Progress,
  Select,
  Avatar,
  Statistic,
  Divider,
} from "antd";
import {
  LikeOutlined,
  DislikeOutlined,
  StarOutlined,
  UserOutlined,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
  RobotOutlined,
  TrophyOutlined,
  WarningOutlined,
  BulbOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/common/KPICard";
import { formatDate } from "@/utils/formatters";

const { Text, Paragraph } = Typography;

interface FeedbackItem {
  id: string;
  user: string;
  agent: string;
  message: string;
  rating: number;
  type: "thumbs_up" | "thumbs_down" | "stars";
  comment: string | null;
  timestamp: string;
  category: string;
}

const mockFeedback: FeedbackItem[] = [
  { id: "f1", user: "Sarah Johnson", agent: "Customer Support Agent", message: "How do I reset my password?", rating: 5, type: "stars", comment: "Very helpful and clear instructions!", timestamp: "2026-02-28T10:15:00Z", category: "helpful" },
  { id: "f2", user: "Michael Chen", agent: "Code Review Agent", message: "Review my pull request #245", rating: 4, type: "stars", comment: "Good review, missed one edge case", timestamp: "2026-02-28T09:30:00Z", category: "mostly_accurate" },
  { id: "f3", user: "Emily Rodriguez", agent: "Customer Support Agent", message: "Why was I charged twice?", rating: 2, type: "stars", comment: "Could not resolve my billing issue, had to escalate", timestamp: "2026-02-28T08:45:00Z", category: "incomplete" },
  { id: "f4", user: "David Kim", agent: "Data Analysis Agent", message: "Generate Q4 revenue report", rating: 5, type: "thumbs_up", comment: null, timestamp: "2026-02-27T16:20:00Z", category: "helpful" },
  { id: "f5", user: "Lisa Wang", agent: "Code Review Agent", message: "Check security of auth module", rating: 5, type: "stars", comment: "Found a critical vulnerability I missed!", timestamp: "2026-02-27T14:10:00Z", category: "helpful" },
  { id: "f6", user: "James Taylor", agent: "Customer Support Agent", message: "Cancel my subscription", rating: 1, type: "thumbs_down", comment: "Agent kept trying to upsell instead of cancelling", timestamp: "2026-02-27T11:00:00Z", category: "wrong_response" },
  { id: "f7", user: "Ana Martinez", agent: "Content Writer Agent", message: "Write a blog post about AI trends", rating: 3, type: "stars", comment: "Too generic, needed more original insights", timestamp: "2026-02-27T09:30:00Z", category: "low_quality" },
  { id: "f8", user: "Robert Brown", agent: "Meeting Summarizer", message: "Summarize today's standup", rating: 5, type: "thumbs_up", comment: "Perfect summary, captured all action items", timestamp: "2026-02-26T15:00:00Z", category: "helpful" },
  { id: "f9", user: "Sarah Johnson", agent: "Data Analysis Agent", message: "Analyze user churn data", rating: 4, type: "stars", comment: "Good insights but missing cohort analysis", timestamp: "2026-02-26T13:20:00Z", category: "mostly_accurate" },
  { id: "f10", user: "Michael Chen", agent: "Customer Support Agent", message: "How to integrate webhook?", rating: 5, type: "stars", comment: "Excellent step-by-step guide with code examples", timestamp: "2026-02-26T10:45:00Z", category: "helpful" },
  { id: "f11", user: "David Kim", agent: "Code Review Agent", message: "Review database migration", rating: 2, type: "stars", comment: "Gave incorrect advice about index strategy", timestamp: "2026-02-26T09:15:00Z", category: "inaccurate" },
  { id: "f12", user: "Emily Rodriguez", agent: "Content Writer Agent", message: "Write product release notes", rating: 4, type: "stars", comment: null, timestamp: "2026-02-25T16:30:00Z", category: "mostly_accurate" },
];

const mockTrend = [
  { date: "Feb 22", satisfaction: 4.1, count: 24 },
  { date: "Feb 23", satisfaction: 4.3, count: 31 },
  { date: "Feb 24", satisfaction: 3.8, count: 18 },
  { date: "Feb 25", satisfaction: 4.0, count: 22 },
  { date: "Feb 26", satisfaction: 4.2, count: 28 },
  { date: "Feb 27", satisfaction: 3.9, count: 35 },
  { date: "Feb 28", satisfaction: 4.4, count: 20 },
];

const agentBreakdown = [
  { agent: "Customer Support Agent", avgRating: 3.6, totalFeedback: 48, thumbsUp: 32, thumbsDown: 16 },
  { agent: "Code Review Agent", avgRating: 4.2, totalFeedback: 35, thumbsUp: 28, thumbsDown: 7 },
  { agent: "Data Analysis Agent", avgRating: 4.5, totalFeedback: 22, thumbsUp: 20, thumbsDown: 2 },
  { agent: "Content Writer Agent", avgRating: 3.5, totalFeedback: 18, thumbsUp: 12, thumbsDown: 6 },
  { agent: "Meeting Summarizer", avgRating: 4.7, totalFeedback: 15, thumbsUp: 14, thumbsDown: 1 },
];

const issueCategories = [
  { category: "Incomplete responses", count: 18, percentage: 28 },
  { category: "Inaccurate information", count: 12, percentage: 19 },
  { category: "Too generic / not specific", count: 10, percentage: 16 },
  { category: "Wrong tone or approach", count: 8, percentage: 12 },
  { category: "Slow response time", count: 7, percentage: 11 },
  { category: "Failed to follow instructions", count: 5, percentage: 8 },
  { category: "Other", count: 4, percentage: 6 },
];

const actionableInsights = [
  { priority: "high", title: "Improve billing-related responses", description: "Customer Support Agent has low satisfaction (2.1 avg) on billing queries. Update knowledge base with billing FAQ and escalation paths.", impact: "Affects 35% of negative feedback" },
  { priority: "high", title: "Add domain-specific context to Code Review", description: "Code Review Agent lacks context about internal indexing strategies. Add technical documentation to knowledge base.", impact: "2 incorrect reviews this week" },
  { priority: "medium", title: "Tune Content Writer temperature", description: "Content Writer Agent rated 'too generic'. Consider lowering temperature or adding more specific prompt instructions.", impact: "Average rating 3.5, below target of 4.0" },
  { priority: "low", title: "Add cohort analysis capability", description: "Data Analysis Agent missing cohort analysis. Consider adding this as a tool or template.", impact: "Requested in 3 feedback items" },
];

const FeedbackDashboard: React.FC = () => {
  const [agentFilter, setAgentFilter] = useState("all");

  const totalFeedback = mockFeedback.length;
  const avgRating = mockFeedback.reduce((s, f) => s + f.rating, 0) / totalFeedback;
  const thumbsUp = mockFeedback.filter((f) => f.rating >= 4).length;
  const thumbsDown = mockFeedback.filter((f) => f.rating <= 2).length;
  const npsScore = Math.round(((thumbsUp - thumbsDown) / totalFeedback) * 100);
  const maxTrendCount = Math.max(...mockTrend.map((t) => t.count));

  const filteredFeedback = agentFilter === "all" ? mockFeedback : mockFeedback.filter((f) => f.agent === agentFilter);

  const ratingColor = (r: number) => (r >= 4 ? "#52c41a" : r >= 3 ? "#fa8c16" : "#ff4d4f");

  const columns = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: 140,
      render: (user: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#0f6fa8" }} />
          <Text style={{ fontSize: 13 }}>{user}</Text>
        </Space>
      ),
    },
    {
      title: "Agent",
      dataIndex: "agent",
      key: "agent",
      width: 170,
      render: (agent: string) => <Tag style={{ borderRadius: 4, fontSize: 11 }}>{agent}</Tag>,
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (msg: string) => <Text style={{ fontSize: 12 }}>{msg}</Text>,
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 130,
      render: (rating: number, record: FeedbackItem) =>
        record.type === "stars" ? (
          <Rate disabled defaultValue={rating} style={{ fontSize: 12 }} />
        ) : (
          <Tag color={rating >= 4 ? "success" : "error"} icon={rating >= 4 ? <LikeOutlined /> : <DislikeOutlined />} style={{ borderRadius: 4 }}>
            {rating >= 4 ? "Positive" : "Negative"}
          </Tag>
        ),
    },
    {
      title: "Comment",
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
      render: (comment: string | null) =>
        comment ? <Text style={{ fontSize: 12, color: "#595959" }}>{comment}</Text> : <Text style={{ fontSize: 12, color: "#bfbfbf" }}>No comment</Text>,
    },
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 130,
      render: (date: string) => <Text style={{ fontSize: 12 }}>{formatDate(date, "MMM DD, HH:mm")}</Text>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Feedback & Ratings"
        subtitle="Monitor user satisfaction and identify improvement opportunities"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Feedback" }]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Avg Rating" value={avgRating.toFixed(1)} prefix={<StarOutlined />} trend={5.2} trendLabel="vs last week" borderColor="#fa8c16" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Positive Ratio"
            value={`${Math.round((thumbsUp / totalFeedback) * 100)}%`}
            prefix={<LikeOutlined />}
            trend={3.1}
            trendLabel="vs last week"
            borderColor="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="NPS Score" value={npsScore} prefix={<SmileOutlined />} trend={8.0} trendLabel="vs last month" borderColor="#0f6fa8" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard title="Total Feedback" value={totalFeedback} prefix={<MessageOutlined />} trend={15.4} trendLabel="vs last week" borderColor="#722ed1" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Satisfaction Trend" style={{ borderRadius: 10 }} bodyStyle={{ padding: "16px 24px" }}>
            <div style={{ height: 180 }}>
              <Flex align="flex-end" gap={16} style={{ height: "100%", paddingTop: 8 }}>
                {mockTrend.map((item) => {
                  const heightPercent = (item.count / maxTrendCount) * 100;
                  return (
                    <Flex key={item.date} vertical align="center" justify="flex-end" style={{ flex: 1, height: "100%" }}>
                      <Text style={{ fontSize: 10, color: ratingColor(item.satisfaction), fontWeight: 600, marginBottom: 2 }}>
                        {item.satisfaction.toFixed(1)}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#8c8c8c", marginBottom: 4 }}>{item.count}</Text>
                      <div
                        style={{
                          width: "60%",
                          height: `${heightPercent}%`,
                          background: `linear-gradient(180deg, ${ratingColor(item.satisfaction)} 0%, ${ratingColor(item.satisfaction)}88 100%)`,
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
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Feedback by Agent" style={{ borderRadius: 10 }} bodyStyle={{ padding: "16px 24px" }}>
            <Space orientation="vertical" style={{ width: "100%" }} size={14}>
              {agentBreakdown.map((item) => (
                <div key={item.agent}>
                  <Flex justify="space-between" style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: 500 }}>{item.agent}</Text>
                    <Space size={8}>
                      <Text style={{ fontSize: 11, color: ratingColor(item.avgRating), fontWeight: 600 }}>
                        {item.avgRating.toFixed(1)}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
                        ({item.totalFeedback})
                      </Text>
                    </Space>
                  </Flex>
                  <Progress
                    percent={(item.avgRating / 5) * 100}
                    showInfo={false}
                    strokeColor={ratingColor(item.avgRating)}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card title="Common Issues Breakdown" style={{ borderRadius: 10 }} bodyStyle={{ padding: "16px 24px" }}>
            <Space orientation="vertical" style={{ width: "100%" }} size={12}>
              {issueCategories.map((item) => (
                <div key={item.category}>
                  <Flex justify="space-between" style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 12 }}>{item.category}</Text>
                    <Space size={4}>
                      <Text style={{ fontSize: 12, fontWeight: 600 }}>{item.count}</Text>
                      <Text style={{ fontSize: 11, color: "#8c8c8c" }}>({item.percentage}%)</Text>
                    </Space>
                  </Flex>
                  <Progress
                    percent={item.percentage}
                    showInfo={false}
                    strokeColor={item.percentage > 20 ? "#ff4d4f" : item.percentage > 10 ? "#fa8c16" : "#52c41a"}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <Flex align="center" gap={8}>
                <BulbOutlined style={{ color: "#fa8c16" }} />
                <span>Actionable Insights</span>
              </Flex>
            }
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: "16px 24px" }}
          >
            <Space orientation="vertical" style={{ width: "100%" }} size={12}>
              {actionableInsights.map((insight, index) => (
                <Card
                  key={index}
                  size="small"
                  style={{
                    borderRadius: 8,
                    borderLeft: `4px solid ${insight.priority === "high" ? "#ff4d4f" : insight.priority === "medium" ? "#fa8c16" : "#52c41a"}`,
                  }}
                >
                  <Flex justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
                        <Tag
                          color={insight.priority === "high" ? "red" : insight.priority === "medium" ? "orange" : "green"}
                          style={{ borderRadius: 4, fontSize: 10, textTransform: "uppercase" }}
                        >
                          {insight.priority}
                        </Tag>
                        <Text strong style={{ fontSize: 13 }}>{insight.title}</Text>
                      </Flex>
                      <Paragraph style={{ fontSize: 11, color: "#595959", margin: "4px 0 0 0" }}>
                        {insight.description}
                      </Paragraph>
                      <Text style={{ fontSize: 10, color: "#8c8c8c" }}>{insight.impact}</Text>
                    </div>
                  </Flex>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent Feedback"
        style={{ borderRadius: 10 }}
        extra={
          <Select
            value={agentFilter}
            onChange={setAgentFilter}
            style={{ width: 200 }}
            options={[
              { value: "all", label: "All Agents" },
              ...agentBreakdown.map((a) => ({ value: a.agent, label: a.agent })),
            ]}
          />
        }
      >
        <Table
          dataSource={filteredFeedback}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} feedback items` }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default FeedbackDashboard;
