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
} from "@ant-design/icons";

import theme from "./theme";
import { authProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ConfigProvider theme={theme}>
        <AntdApp>
          <Refine
            routerProvider={routerBindings}
            authProvider={authProvider}
            dataProvider={dataProvider}
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
