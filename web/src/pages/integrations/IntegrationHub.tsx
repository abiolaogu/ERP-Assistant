import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  Typography,
  Table,
  Flex,
  Avatar,
  Switch,
  Divider,
  Statistic,
  Tabs,
  message,
  Tooltip,
} from "antd";
import {
  ApiOutlined,
  SlackOutlined,
  MailOutlined,
  MessageOutlined,
  GlobalOutlined,
  CodeOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  CopyOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";
import KPICard from "@/components/common/KPICard";
import StatusBadge from "@/components/common/StatusBadge";
import { formatDate, formatNumber } from "@/utils/formatters";

const { Text, Paragraph } = Typography;

interface Integration {
  id: string;
  name: string;
  type: "slack" | "teams" | "email" | "whatsapp" | "webchat" | "api";
  icon: React.ReactNode;
  color: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  messagesHandled: number;
  lastActive: string | null;
  config: {
    apiKey?: string;
    webhookUrl?: string;
    channel?: string;
    endpoint?: string;
  };
  activityLog: { timestamp: string; event: string; details: string }[];
}

interface ActivityLogEntry {
  timestamp: string;
  event: string;
  details: string;
}

const mockIntegrations: Integration[] = [
  {
    id: "int-001",
    name: "Slack",
    type: "slack",
    icon: <SlackOutlined />,
    color: "#4A154B",
    description: "Connect AI assistants to Slack channels for direct messaging and channel-based interactions",
    status: "connected",
    messagesHandled: 2847,
    lastActive: "2026-02-28T10:15:00Z",
    config: { apiKey: "xoxb-****-****-****", webhookUrl: "https://hooks.slack.com/services/T****/B****/****", channel: "#ai-assistant" },
    activityLog: [
      { timestamp: "2026-02-28T10:15:00Z", event: "message_received", details: "Incoming message in #ai-assistant from @sarah" },
      { timestamp: "2026-02-28T10:14:50Z", event: "response_sent", details: "Response delivered to #ai-assistant (1.2s latency)" },
      { timestamp: "2026-02-28T10:10:00Z", event: "message_received", details: "Direct message from @michael.chen" },
      { timestamp: "2026-02-28T09:55:00Z", event: "response_sent", details: "Response delivered to DM with @michael.chen" },
      { timestamp: "2026-02-28T09:30:00Z", event: "bot_mentioned", details: "Bot mentioned in #engineering channel" },
    ],
  },
  {
    id: "int-002",
    name: "Microsoft Teams",
    type: "teams",
    icon: <MessageOutlined />,
    color: "#6264A7",
    description: "Integrate with Microsoft Teams for enterprise communication and collaboration workflows",
    status: "connected",
    messagesHandled: 1523,
    lastActive: "2026-02-28T09:45:00Z",
    config: { apiKey: "ey****...****", webhookUrl: "https://outlook.office.com/webhook/****", channel: "AI Support" },
    activityLog: [
      { timestamp: "2026-02-28T09:45:00Z", event: "message_received", details: "Message in AI Support channel" },
      { timestamp: "2026-02-28T09:44:55Z", event: "response_sent", details: "Response delivered (0.9s latency)" },
      { timestamp: "2026-02-28T09:30:00Z", event: "card_sent", details: "Adaptive card sent with action items" },
    ],
  },
  {
    id: "int-003",
    name: "Email",
    type: "email",
    icon: <MailOutlined />,
    color: "#D44638",
    description: "Process incoming emails and auto-respond using AI assistants with template support",
    status: "connected",
    messagesHandled: 956,
    lastActive: "2026-02-28T08:30:00Z",
    config: { apiKey: "SG.****...****", webhookUrl: "https://api.erp.com/webhooks/email", channel: "support@company.com" },
    activityLog: [
      { timestamp: "2026-02-28T08:30:00Z", event: "email_received", details: "Incoming email from customer@example.com" },
      { timestamp: "2026-02-28T08:29:00Z", event: "response_sent", details: "Auto-reply sent to customer@example.com" },
      { timestamp: "2026-02-28T07:45:00Z", event: "email_classified", details: "Email classified as: billing inquiry" },
    ],
  },
  {
    id: "int-004",
    name: "WhatsApp",
    type: "whatsapp",
    icon: <MessageOutlined />,
    color: "#25D366",
    description: "Connect to WhatsApp Business API for customer support and automated messaging",
    status: "disconnected",
    messagesHandled: 0,
    lastActive: null,
    config: {},
    activityLog: [],
  },
  {
    id: "int-005",
    name: "Web Chat Widget",
    type: "webchat",
    icon: <GlobalOutlined />,
    color: "#0f6fa8",
    description: "Embeddable chat widget for your website with customizable appearance and behavior",
    status: "connected",
    messagesHandled: 4210,
    lastActive: "2026-02-28T10:20:00Z",
    config: { apiKey: "wc_****...****", endpoint: "https://chat.erp.com/widget" },
    activityLog: [
      { timestamp: "2026-02-28T10:20:00Z", event: "chat_started", details: "New chat session from visitor (US)" },
      { timestamp: "2026-02-28T10:19:00Z", event: "response_sent", details: "Auto-response to pricing inquiry" },
      { timestamp: "2026-02-28T10:15:00Z", event: "chat_ended", details: "Session ended - satisfaction: 5/5" },
      { timestamp: "2026-02-28T10:00:00Z", event: "chat_started", details: "New chat session from visitor (UK)" },
    ],
  },
  {
    id: "int-006",
    name: "REST API",
    type: "api",
    icon: <ApiOutlined />,
    color: "#722ed1",
    description: "Direct API access for custom integrations with full authentication and rate limiting",
    status: "connected",
    messagesHandled: 12450,
    lastActive: "2026-02-28T10:25:00Z",
    config: { apiKey: "sk_live_****...****", endpoint: "https://api.erp.com/v1/assistant" },
    activityLog: [
      { timestamp: "2026-02-28T10:25:00Z", event: "api_call", details: "POST /v1/assistant/chat - 200 OK (340ms)" },
      { timestamp: "2026-02-28T10:24:00Z", event: "api_call", details: "POST /v1/assistant/chat - 200 OK (280ms)" },
      { timestamp: "2026-02-28T10:22:00Z", event: "api_call", details: "GET /v1/assistant/agents - 200 OK (45ms)" },
      { timestamp: "2026-02-28T10:20:00Z", event: "rate_limited", details: "Rate limit exceeded for client app-xyz (429)" },
    ],
  },
];

const webChatSnippet = `<!-- ERP Assistant Chat Widget -->
<script>
  (function(w, d, s, o, f) {
    w['ERPChat'] = o;
    w[o] = w[o] || function() {
      (w[o].q = w[o].q || []).push(arguments);
    };
    var js = d.createElement(s);
    js.src = f;
    js.async = 1;
    d.head.appendChild(js);
  })(window, document, 'script', 'erpchat',
    'https://chat.erp.com/widget.js');

  erpchat('init', {
    apiKey: 'wc_your_api_key_here',
    position: 'bottom-right',
    theme: 'light',
    greeting: 'Hi! How can I help you?'
  });
</script>`;

const IntegrationHub: React.FC = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [snippetModalOpen, setSnippetModalOpen] = useState(false);
  const [form] = Form.useForm();

  const connectedCount = mockIntegrations.filter((i) => i.status === "connected").length;
  const totalMessages = mockIntegrations.reduce((s, i) => s + i.messagesHandled, 0);

  const openConfig = (integration: Integration) => {
    setSelectedIntegration(integration);
    form.setFieldsValue({
      apiKey: integration.config.apiKey || "",
      webhookUrl: integration.config.webhookUrl || "",
      channel: integration.config.channel || "",
      endpoint: integration.config.endpoint || "",
    });
    setConfigModalOpen(true);
  };

  const handleSaveConfig = () => {
    form.validateFields().then((values) => {
      console.log("Saving config:", values);
      message.success("Integration configuration saved");
      setConfigModalOpen(false);
    });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />;
      case "error": return <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />;
      default: return <CloseCircleOutlined style={{ color: "#d9d9d9", fontSize: 16 }} />;
    }
  };

  const statusColors: Record<string, string> = {
    connected: "success",
    disconnected: "default",
    error: "error",
  };

  const activityColumns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 140,
      render: (date: string) => <Text style={{ fontSize: 12 }}>{formatDate(date, "HH:mm:ss")}</Text>,
    },
    {
      title: "Event",
      dataIndex: "event",
      key: "event",
      width: 160,
      render: (event: string) => <Tag style={{ borderRadius: 4, fontSize: 11 }}>{event.replace(/_/g, " ")}</Tag>,
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      render: (details: string) => <Text style={{ fontSize: 12 }}>{details}</Text>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Integration Hub"
        subtitle="Connect AI assistants to your communication channels and services"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Integrations" }]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <KPICard title="Connected" value={connectedCount} prefix={<LinkOutlined />} borderColor="#52c41a" />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard title="Total Messages" value={formatNumber(totalMessages)} prefix={<MessageOutlined />} trend={22.5} trendLabel="vs last week" borderColor="#0f6fa8" />
        </Col>
        <Col xs={24} sm={8}>
          <KPICard title="Available" value={mockIntegrations.length} prefix={<ApiOutlined />} borderColor="#722ed1" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {mockIntegrations.map((integration) => (
          <Col key={integration.id} xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ borderRadius: 10, height: "100%" }}
              bodyStyle={{ padding: 20, display: "flex", flexDirection: "column", height: "100%" }}
            >
              <Flex justify="space-between" align="flex-start" style={{ marginBottom: 12 }}>
                <Space size={10}>
                  <Avatar
                    size={44}
                    icon={integration.icon}
                    style={{ backgroundColor: integration.color, fontSize: 20 }}
                  />
                  <div>
                    <Text strong style={{ fontSize: 15, display: "block" }}>{integration.name}</Text>
                    <StatusBadge status={integration.status} colorMap={statusColors} />
                  </div>
                </Space>
                {statusIcon(integration.status)}
              </Flex>

              <Paragraph
                style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 16, flex: 1 }}
                ellipsis={{ rows: 2 }}
              >
                {integration.description}
              </Paragraph>

              <Row gutter={8} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Statistic
                    title={<Text style={{ fontSize: 11 }}>Messages</Text>}
                    value={integration.messagesHandled}
                    valueStyle={{ fontSize: 16, fontWeight: 700 }}
                  />
                </Col>
                <Col span={12}>
                  <div>
                    <Text style={{ fontSize: 11, color: "#8c8c8c", display: "block" }}>Last Active</Text>
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>
                      {integration.lastActive ? formatDate(integration.lastActive, "MMM DD, HH:mm") : "Never"}
                    </Text>
                  </div>
                </Col>
              </Row>

              <Flex gap={8} style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                <Button
                  type="primary"
                  size="small"
                  icon={<SettingOutlined />}
                  onClick={() => openConfig(integration)}
                  style={{ flex: 1 }}
                >
                  Configure
                </Button>
                {integration.type === "webchat" && (
                  <Tooltip title="Get Widget Code">
                    <Button size="small" icon={<CodeOutlined />} onClick={() => setSnippetModalOpen(true)} />
                  </Tooltip>
                )}
                {integration.status === "connected" && (
                  <Tooltip title="View Activity">
                    <Button size="small" icon={<HistoryOutlined />} onClick={() => { setSelectedIntegration(integration); setConfigModalOpen(true); }} />
                  </Tooltip>
                )}
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={
          <Flex align="center" gap={8}>
            {selectedIntegration?.icon}
            <span>Configure {selectedIntegration?.name}</span>
          </Flex>
        }
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={handleSaveConfig}
        okText="Save Configuration"
        width={600}
      >
        {selectedIntegration && (
          <Tabs
            defaultActiveKey="config"
            items={[
              {
                key: "config",
                label: "Configuration",
                children: (
                  <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item name="apiKey" label="API Key">
                      <Input.Password placeholder="Enter API key" />
                    </Form.Item>
                    {(selectedIntegration.type !== "api" && selectedIntegration.type !== "webchat") && (
                      <Form.Item name="webhookUrl" label="Webhook URL">
                        <Input placeholder="https://..." />
                      </Form.Item>
                    )}
                    {(selectedIntegration.type !== "api" && selectedIntegration.type !== "webchat") && (
                      <Form.Item name="channel" label="Channel / Inbox">
                        <Input placeholder="e.g. #ai-assistant" />
                      </Form.Item>
                    )}
                    {(selectedIntegration.type === "api" || selectedIntegration.type === "webchat") && (
                      <Form.Item name="endpoint" label="Endpoint URL">
                        <Input placeholder="https://api.erp.com/v1/assistant" disabled />
                      </Form.Item>
                    )}
                    <Flex gap={8}>
                      <Button type="primary" icon={<SyncOutlined />}>Test Connection</Button>
                      {selectedIntegration.status === "connected" ? (
                        <Button danger>Disconnect</Button>
                      ) : (
                        <Button type="primary" style={{ background: "#52c41a", borderColor: "#52c41a" }}>Connect</Button>
                      )}
                    </Flex>
                  </Form>
                ),
              },
              {
                key: "activity",
                label: "Activity Log",
                children: (
                  <Table
                    dataSource={selectedIntegration.activityLog}
                    columns={activityColumns}
                    rowKey="timestamp"
                    pagination={false}
                    size="small"
                    locale={{ emptyText: "No activity recorded" }}
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>

      <Modal
        title="Web Chat Widget Code"
        open={snippetModalOpen}
        onCancel={() => setSnippetModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setSnippetModalOpen(false)}>Close</Button>,
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(webChatSnippet);
              message.success("Code snippet copied to clipboard");
            }}
          >
            Copy Code
          </Button>,
        ]}
        width={600}
      >
        <Text style={{ fontSize: 13, color: "#595959", display: "block", marginBottom: 12 }}>
          Add this code snippet to your website's HTML, just before the closing body tag:
        </Text>
        <pre
          style={{
            background: "#1a1a2e",
            color: "#d4d4d4",
            padding: 16,
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.6,
            overflow: "auto",
            maxHeight: 360,
          }}
        >
          {webChatSnippet}
        </pre>
      </Modal>
    </div>
  );
};

export default IntegrationHub;
