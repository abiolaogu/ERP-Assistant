import React from "react";
import { Breadcrumb, Flex, Typography, Space } from "antd";

const { Title, Text } = Typography;

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  extra,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 12 }}
          items={breadcrumbs.map((item) => ({
            title: item.href ? (
              <a href={item.href}>{item.title}</a>
            ) : (
              item.title
            ),
          }))}
        />
      )}
      <Flex justify="space-between" align="center">
        <Space direction="vertical" size={0}>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            {title}
          </Title>
          {subtitle && (
            <Text style={{ color: "#8c8c8c", fontSize: 14 }}>{subtitle}</Text>
          )}
        </Space>
        {extra && <Space>{extra}</Space>}
      </Flex>
    </div>
  );
};

export default PageHeader;
