import React from "react";
import { Card, Statistic, Space, Typography } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface KPICardProps {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  borderColor?: string;
  loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  trendLabel,
  borderColor = "#0f6fa8",
  loading = false,
}) => {
  const isPositiveTrend = trend !== undefined && trend >= 0;

  return (
    <Card
      loading={loading}
      style={{
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 10,
        height: "100%",
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      <Statistic
        title={
          <Text style={{ fontSize: 13, color: "#8c8c8c", fontWeight: 500 }}>
            {title}
          </Text>
        }
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e" }}
      />
      {trend !== undefined && (
        <Space size={4} style={{ marginTop: 8 }}>
          {isPositiveTrend ? (
            <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 12 }} />
          ) : (
            <ArrowDownOutlined style={{ color: "#ff4d4f", fontSize: 12 }} />
          )}
          <Text
            style={{
              fontSize: 13,
              color: isPositiveTrend ? "#52c41a" : "#ff4d4f",
              fontWeight: 600,
            }}
          >
            {Math.abs(trend)}%
          </Text>
          {trendLabel && (
            <Text style={{ fontSize: 12, color: "#8c8c8c" }}>
              {trendLabel}
            </Text>
          )}
        </Space>
      )}
    </Card>
  );
};

export default KPICard;
