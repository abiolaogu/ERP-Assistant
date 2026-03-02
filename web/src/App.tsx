import React from "react";
import { Refine } from "@refinedev/core";
import { ConfigProvider, App as AntdApp } from "antd";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import routerBindings from "@refinedev/react-router-v6";
import {
  DashboardOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  DiffOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  MessageOutlined,
  ControlOutlined,
  BookOutlined,
  StarOutlined,
  FileTextOutlined,
  ApiOutlined,
  BarChartOutlined,
  ToolOutlined,
} from "@ant-design/icons";

import theme from "./theme";
import { authProvider } from "./authProvider";
import { dataProvider } from "./providers/hasuraDataProvider";
import { liveProvider } from "./providers/hasuraLiveProvider";

import MainLayout from "./components/Layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import AgentList from "./pages/agents/AgentList";
import AgentShow from "./pages/agents/AgentShow";
import AgentCreate from "./pages/agents/AgentCreate";
import RunList from "./pages/runs/RunList";
import RunShow from "./pages/runs/RunShow";
import DiffReview from "./pages/diffs/DiffReview";
import ApprovalList from "./pages/approvals/ApprovalList";
import ApprovalShow from "./pages/approvals/ApprovalShow";
import Settings from "./pages/Settings";
import ConversationHistory from "./pages/conversations/ConversationHistory";
import AgentConfig from "./pages/agents/AgentConfig";
import KnowledgeBase from "./pages/knowledge/KnowledgeBase";
import FeedbackDashboard from "./pages/feedback/FeedbackDashboard";
import PromptLibrary from "./pages/prompts/PromptLibrary";
import IntegrationHub from "./pages/integrations/IntegrationHub";
import UsageAnalytics from "./pages/analytics/UsageAnalytics";
import ToolsManager from "./pages/tools/ToolsManager";

const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ConfigProvider theme={theme}>
        <AntdApp>
          <Refine
            routerProvider={routerBindings}
            authProvider={authProvider}
            dataProvider={dataProvider}
            liveProvider={liveProvider}
            resources={[
              {
                name: "dashboard",
                list: "/",
                meta: { label: "Dashboard", icon: <DashboardOutlined /> },
              },
              {
                name: "agents",
                list: "/agents",
                show: "/agents/:id",
                create: "/agents/new",
                meta: { icon: <RobotOutlined /> },
              },
              {
                name: "runs",
                list: "/runs",
                show: "/runs/:id",
                meta: {
                  label: "Agent Runs",
                  icon: <ThunderboltOutlined />,
                },
              },
              {
                name: "diffs",
                list: "/diffs",
                meta: { label: "Diff Review", icon: <DiffOutlined /> },
              },
              {
                name: "approvals",
                list: "/approvals",
                show: "/approvals/:id",
                meta: { icon: <CheckCircleOutlined /> },
              },
              {
                name: "conversations",
                list: "/conversations",
                meta: { label: "Conversations", icon: <MessageOutlined /> },
              },
              {
                name: "agent-config",
                list: "/agent-config",
                meta: { label: "Agent Config", icon: <ControlOutlined /> },
              },
              {
                name: "knowledge-base",
                list: "/knowledge-base",
                meta: { label: "Knowledge Base", icon: <BookOutlined /> },
              },
              {
                name: "feedback",
                list: "/feedback",
                meta: { label: "Feedback", icon: <StarOutlined /> },
              },
              {
                name: "prompts",
                list: "/prompts",
                meta: { label: "Prompt Library", icon: <FileTextOutlined /> },
              },
              {
                name: "integrations",
                list: "/integrations",
                meta: { label: "Integrations", icon: <ApiOutlined /> },
              },
              {
                name: "analytics",
                list: "/analytics",
                meta: { label: "Usage Analytics", icon: <BarChartOutlined /> },
              },
              {
                name: "tools",
                list: "/tools",
                meta: { label: "Skills & Tools", icon: <ToolOutlined /> },
              },
              {
                name: "settings",
                list: "/settings",
                meta: { icon: <SettingOutlined /> },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="/agents" element={<AgentList />} />
                <Route path="/agents/new" element={<AgentCreate />} />
                <Route path="/agents/:id" element={<AgentShow />} />
                <Route path="/runs" element={<RunList />} />
                <Route path="/runs/:id" element={<RunShow />} />
                <Route path="/diffs" element={<DiffReview />} />
                <Route path="/approvals" element={<ApprovalList />} />
                <Route path="/approvals/:id" element={<ApprovalShow />} />
                <Route path="/conversations" element={<ConversationHistory />} />
                <Route path="/agent-config" element={<AgentConfig />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/feedback" element={<FeedbackDashboard />} />
                <Route path="/prompts" element={<PromptLibrary />} />
                <Route path="/integrations" element={<IntegrationHub />} />
                <Route path="/analytics" element={<UsageAnalytics />} />
                <Route path="/tools" element={<ToolsManager />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
