import React from "react";
import { Tag } from "antd";
import { STATUS_COLORS } from "@/utils/constants";

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, colorMap }) => {
  const colors = colorMap || STATUS_COLORS;
  const color = colors[status.toLowerCase()] || "default";

  return (
    <Tag
      color={color}
      style={{
        textTransform: "capitalize",
        fontWeight: 500,
        borderRadius: 6,
        fontSize: 12,
      }}
    >
      {status.replace(/_/g, " ")}
    </Tag>
  );
};

export default StatusBadge;
