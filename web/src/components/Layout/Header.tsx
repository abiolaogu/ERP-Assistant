import React from "react";
import {
  Flex,
  Input,
  Badge,
  Avatar,
  Dropdown,
  Breadcrumb,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { useLocation, Link } from "react-router-dom";

const { Text } = Typography;

const Header: React.FC = () => {
  const { data: identity } = useGetIdentity<{
    name: string;
    email: string;
    avatar?: string;
  }>();
  const { mutate: logout } = useLogout();
  const location = useLocation();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumbItems = [
    { title: <Link to="/">Home</Link> },
    ...pathSegments.map((segment, index) => {
      const path = "/" + pathSegments.slice(0, index + 1).join("/");
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      return {
        title:
          index === pathSegments.length - 1 ? (
            label
          ) : (
            <Link to={path}>{label}</Link>
          ),
      };
    }),
  ];

  const dropdownItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: () => logout(),
    },
  ];

  return (
    <Flex
      align="center"
      justify="space-between"
      style={{
        height: 64,
        padding: "0 24px",
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <Breadcrumb items={breadcrumbItems} />

      <Flex align="center" gap={16}>
        <Input
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          placeholder="Search..."
          style={{
            width: 240,
            borderRadius: 8,
            background: "#f5f5f5",
          }}
          variant="filled"
        />

        <Badge count={5} size="small">
          <BellOutlined
            style={{ fontSize: 18, color: "#595959", cursor: "pointer" }}
          />
        </Badge>

        <Dropdown menu={{ items: dropdownItems }} trigger={["click"]}>
          <Flex align="center" gap={8} style={{ cursor: "pointer" }}>
            <Avatar
              size={32}
              icon={<UserOutlined />}
              src={identity?.avatar}
              style={{ backgroundColor: "#0f6fa8" }}
            />
            <Text style={{ fontSize: 13, fontWeight: 500, maxWidth: 120 }} ellipsis>
              {identity?.name || "User"}
            </Text>
          </Flex>
        </Dropdown>
      </Flex>
    </Flex>
  );
};

export default Header;
