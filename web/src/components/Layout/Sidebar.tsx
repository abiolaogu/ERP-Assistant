import React from "react";
import { Menu, Typography, Flex } from "antd";
import {
  DashboardOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  DiffOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const menuItems = [
  {
    key: "/",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/agents",
    icon: <RobotOutlined />,
    label: "Agents",
  },
  {
    key: "/runs",
    icon: <ThunderboltOutlined />,
    label: "Agent Runs",
  },
  {
    key: "/diffs",
    icon: <DiffOutlined />,
    label: "Diff Review",
  },
  {
    key: "/approvals",
    icon: <CheckCircleOutlined />,
    label: "Approvals",
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "Settings",
  },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey =
    menuItems
      .filter((item) => item.key !== "/")
      .find((item) => location.pathname.startsWith(item.key))?.key ||
    (location.pathname === "/" ? "/" : "/");

  return (
    <Flex vertical justify="space-between" style={{ height: "100%" }}>
      <div>
        <Flex
          justify="center"
          align="center"
          style={{
            height: 64,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <RobotOutlined
            style={{ color: "#0f6fa8", fontSize: collapsed ? 24 : 28 }}
          />
          {!collapsed && (
            <Text
              strong
              style={{
                color: "#fff",
                fontSize: 18,
                marginLeft: 10,
                letterSpacing: -0.5,
              }}
            >
              Assistant
            </Text>
          )}
        </Flex>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </div>

      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          textAlign: "center",
          cursor: "pointer",
        }}
        onClick={() => onCollapse(!collapsed)}
      >
        {collapsed ? (
          <MenuUnfoldOutlined style={{ color: "#ffffffa6", fontSize: 16 }} />
        ) : (
          <Flex align="center" justify="center" gap={8}>
            <MenuFoldOutlined style={{ color: "#ffffffa6", fontSize: 16 }} />
            <Text style={{ color: "#ffffffa6", fontSize: 12 }}>Collapse</Text>
          </Flex>
        )}
      </div>
    </Flex>
  );
};

export default Sidebar;
