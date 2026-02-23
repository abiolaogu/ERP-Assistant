import React from "react";
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Descriptions,
  Tag,
} from "antd";
import {
  SaveOutlined,
  KeyOutlined,
  RobotOutlined,
  BellOutlined,
  DollarOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import PageHeader from "@/components/common/PageHeader";

const { Text } = Typography;

const Settings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: Record<string, unknown>) => {
    console.log("Saving settings:", values);
    message.success("Settings saved successfully");
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure your AI Assistant platform"
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Settings" }]}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          defaultModel: "gpt-4o",
          maxCostPerRun: 1.0,
          dailyCostLimit: 50.0,
          autoApprove: false,
          emailNotifications: true,
          slackNotifications: false,
          notifyOnFailure: true,
          notifyOnApproval: true,
        }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <KeyOutlined style={{ color: "#0f6fa8" }} />
                  <span>API Keys</span>
                </Space>
              }
              style={{ borderRadius: 10, marginBottom: 24 }}
            >
              <Form.Item
                name="openaiKey"
                label="OpenAI API Key"
              >
                <Input.Password
                  placeholder="sk-..."
                  size="large"
                  iconRender={(visible) =>
                    visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item
                name="anthropicKey"
                label="Anthropic API Key"
              >
                <Input.Password
                  placeholder="sk-ant-..."
                  size="large"
                  iconRender={(visible) =>
                    visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item
                name="googleKey"
                label="Google AI API Key"
              >
                <Input.Password
                  placeholder="AIza..."
                  size="large"
                  iconRender={(visible) =>
                    visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
                <Descriptions.Item label="OpenAI Status">
                  <Tag color="success">Connected</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Anthropic Status">
                  <Tag color="success">Connected</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Google AI Status">
                  <Tag color="default">Not configured</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={
                <Space>
                  <RobotOutlined style={{ color: "#0f6fa8" }} />
                  <span>Default Model</span>
                </Space>
              }
              style={{ borderRadius: 10 }}
            >
              <Form.Item
                name="defaultModel"
                label="Default AI Model"
                extra="This model will be used as the default for new agents"
              >
                <Select size="large">
                  <Select.Option value="gpt-4o">GPT-4o</Select.Option>
                  <Select.Option value="gpt-4o-mini">GPT-4o Mini</Select.Option>
                  <Select.Option value="claude-3.5-sonnet">Claude 3.5 Sonnet</Select.Option>
                  <Select.Option value="claude-3-opus">Claude 3 Opus</Select.Option>
                  <Select.Option value="gemini-pro">Gemini Pro</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="autoApprove"
                label="Auto-Approve Changes"
                extra="Automatically approve agent-generated changes without manual review"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <BellOutlined style={{ color: "#0f6fa8" }} />
                  <span>Notifications</span>
                </Space>
              }
              style={{ borderRadius: 10, marginBottom: 24 }}
            >
              <Form.Item
                name="emailNotifications"
                label="Email Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="slackNotifications"
                label="Slack Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="slackWebhook"
                label="Slack Webhook URL"
              >
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  size="large"
                />
              </Form.Item>

              <Divider style={{ margin: "16px 0" }} />

              <Text strong style={{ display: "block", marginBottom: 12 }}>
                Notify me when:
              </Text>

              <Form.Item
                name="notifyOnFailure"
                valuePropName="checked"
                style={{ marginBottom: 8 }}
              >
                <Space>
                  <Switch size="small" defaultChecked />
                  <Text style={{ fontSize: 13 }}>Agent run fails</Text>
                </Space>
              </Form.Item>

              <Form.Item
                name="notifyOnApproval"
                valuePropName="checked"
                style={{ marginBottom: 8 }}
              >
                <Space>
                  <Switch size="small" defaultChecked />
                  <Text style={{ fontSize: 13 }}>New approval request</Text>
                </Space>
              </Form.Item>

              <Form.Item
                name="notifyOnCompletion"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Space>
                  <Switch size="small" />
                  <Text style={{ fontSize: 13 }}>Agent run completes</Text>
                </Space>
              </Form.Item>
            </Card>

            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: "#0f6fa8" }} />
                  <span>Cost Limits</span>
                </Space>
              }
              style={{ borderRadius: 10 }}
            >
              <Form.Item
                name="maxCostPerRun"
                label="Max Cost Per Run (USD)"
                extra="Individual agent runs will be stopped if cost exceeds this limit"
              >
                <InputNumber
                  min={0.01}
                  max={100}
                  step={0.1}
                  prefix="$"
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="dailyCostLimit"
                label="Daily Cost Limit (USD)"
                extra="All agent runs will be paused when daily spending reaches this limit"
              >
                <InputNumber
                  min={1}
                  max={10000}
                  step={1}
                  prefix="$"
                  style={{ width: "100%" }}
                  size="large"
                />
              </Form.Item>

              <Descriptions size="small" column={1} bordered style={{ marginTop: 16 }}>
                <Descriptions.Item label="Today's Spending">
                  <Text strong style={{ color: "#0f6fa8" }}>$27.60</Text>
                </Descriptions.Item>
                <Descriptions.Item label="This Month">
                  <Text strong>$342.18</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Budget Remaining">
                  <Text strong style={{ color: "#52c41a" }}>$22.40 / $50.00</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Space>
            <Button size="large">Reset</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
            >
              Save Settings
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default Settings;
