import React from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  message,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";

const { TextArea } = Input;

const availableModels = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "gemini-pro", label: "Gemini Pro" },
];

const availableCapabilities = [
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "node.js", label: "Node.js" },
  { value: "graphql", label: "GraphQL" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "jest", label: "Jest" },
  { value: "vitest", label: "Vitest" },
  { value: "playwright", label: "Playwright" },
  { value: "security-audit", label: "Security Audit" },
  { value: "performance", label: "Performance" },
  { value: "code-review", label: "Code Review" },
  { value: "refactoring", label: "Refactoring" },
  { value: "debugging", label: "Debugging" },
  { value: "markdown", label: "Markdown" },
  { value: "openapi", label: "OpenAPI" },
  { value: "jsdoc", label: "JSDoc" },
];

const AgentCreate: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = (values: Record<string, unknown>) => {
    console.log("Creating agent:", values);
    message.success("Agent created successfully");
    navigate("/agents");
  };

  return (
    <div>
      <PageHeader
        title="Create Agent"
        subtitle="Configure a new AI coding assistant"
        breadcrumbs={[
          { title: "Home", href: "/" },
          { title: "Agents", href: "/agents" },
          { title: "Create" },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/agents")}>
            Back
          </Button>
        }
      />

      <Card style={{ borderRadius: 10, maxWidth: 720 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark="optional"
        >
          <Form.Item
            name="name"
            label="Agent Name"
            rules={[{ required: true, message: "Please enter an agent name" }]}
          >
            <Input placeholder="e.g. Code Generator" size="large" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Agent Type"
            rules={[{ required: true, message: "Please select a type" }]}
          >
            <Select placeholder="Select agent type" size="large">
              <Select.Option value="coding">Coding</Select.Option>
              <Select.Option value="review">Code Review</Select.Option>
              <Select.Option value="testing">Testing</Select.Option>
              <Select.Option value="documentation">Documentation</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="model"
            label="AI Model"
            rules={[{ required: true, message: "Please select a model" }]}
          >
            <Select
              placeholder="Select AI model"
              size="large"
              options={availableModels}
            />
          </Form.Item>

          <Form.Item
            name="capabilities"
            label="Capabilities"
            rules={[{ required: true, message: "Please select at least one capability" }]}
          >
            <Select
              mode="multiple"
              placeholder="Select capabilities"
              size="large"
              options={availableCapabilities}
              maxTagCount={5}
            />
          </Form.Item>

          <Form.Item
            name="systemPrompt"
            label="System Prompt"
            rules={[{ required: true, message: "Please enter a system prompt" }]}
          >
            <TextArea
              rows={8}
              placeholder={`You are a senior developer. Follow these guidelines:\n- Use strict TypeScript\n- Follow functional programming patterns\n- Include comprehensive error handling\n- Add JSDoc comments`}
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={3}
              placeholder="Describe what this agent does..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
              >
                Create Agent
              </Button>
              <Button size="large" onClick={() => navigate("/agents")}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AgentCreate;
