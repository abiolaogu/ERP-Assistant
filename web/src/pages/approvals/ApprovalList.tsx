import React from "react";
import { Table, Button, Tag, Space, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import type { Approval } from "@/types/assistant.types";
import { formatDate } from "@/utils/formatters";
import { APPROVAL_TYPE_COLORS } from "@/utils/constants";

const { Text } = Typography;

const mockApprovals: Approval[] = [
  { id: "ap1", runId: "r1", agentName: "Code Generator", requestedBy: "System", type: "code_change", status: "pending", description: "Generated user authentication module with JWT login, logout, and middleware. Changes include 3 new files in src/auth/.", diffCount: 3, createdAt: "2026-02-23T10:17:30Z" },
  { id: "ap2", runId: "r3", agentName: "Test Writer", requestedBy: "System", type: "code_change", status: "pending", description: "Generated unit tests for payment service including processPayment, refund, and webhook handling tests.", diffCount: 5, createdAt: "2026-02-23T09:48:20Z" },
  { id: "ap3", runId: "r5", agentName: "Documentation Generator", requestedBy: "Jane Doe", type: "code_change", status: "approved", description: "Generated API documentation for v2 endpoints covering authentication, products, orders, and payments.", diffCount: 1, createdAt: "2026-02-23T08:04:30Z", reviewedAt: "2026-02-23T08:30:00Z", reviewedBy: "John Smith" },
  { id: "ap4", runId: "r6", agentName: "Bug Fixer", requestedBy: "System", type: "code_change", status: "approved", description: "Fixed TypeError in OrderService.calculateTotal() by adding null checks for items array, price and quantity.", diffCount: 1, createdAt: "2026-02-22T16:01:30Z", reviewedAt: "2026-02-22T16:15:00Z", reviewedBy: "Jane Doe" },
  { id: "ap5", runId: "r9", agentName: "Code Generator", requestedBy: "Admin", type: "deployment", status: "rejected", description: "Attempted to deploy staging configuration to production environment. Rejected due to missing approval chain.", diffCount: 2, createdAt: "2026-02-22T14:00:00Z", reviewedAt: "2026-02-22T14:10:00Z", reviewedBy: "John Smith" },
  { id: "ap6", runId: "r10", agentName: "Refactoring Assistant", requestedBy: "System", type: "code_change", status: "pending", description: "Refactored database query builder to use builder pattern. Affects 8 files across services layer.", diffCount: 8, createdAt: "2026-02-22T11:00:00Z" },
  { id: "ap7", runId: "r11", agentName: "Security Scanner", requestedBy: "System", type: "config_change", status: "approved", description: "Updated dependency versions to patch 3 known CVEs: express, lodash, and axios.", diffCount: 1, createdAt: "2026-02-21T15:00:00Z", reviewedAt: "2026-02-21T15:30:00Z", reviewedBy: "Admin" },
];

const ApprovalList: React.FC = () => {
  const navigate = useNavigate();

  const pendingCount = mockApprovals.filter((a) => a.status === "pending").length;

  const columns: ColumnsType<Approval> = [
    {
      title: "Agent",
      dataIndex: "agentName",
      key: "agentName",
      width: 180,
      render: (text: string, record: Approval) => (
        <a onClick={() => navigate(`/approvals/${record.id}`)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 130,
      filters: [
        { text: "Code Change", value: "code_change" },
        { text: "Deployment", value: "deployment" },
        { text: "Config Change", value: "config_change" },
      ],
      render: (type: string) => (
        <Tag
          color={APPROVAL_TYPE_COLORS[type]}
          style={{ textTransform: "capitalize", borderRadius: 4 }}
        >
          {type.replace(/_/g, " ")}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      filters: [
        { text: "Pending", value: "pending" },
        { text: "Approved", value: "approved" },
        { text: "Rejected", value: "rejected" },
      ],
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => (
        <Text style={{ fontSize: 13 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Diffs",
      dataIndex: "diffCount",
      key: "diffCount",
      width: 60,
      render: (val: number) => <Text style={{ fontWeight: 500 }}>{val}</Text>,
    },
    {
      title: "Requested",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      sorter: true,
      defaultSortOrder: "descend",
      render: (date: string) => formatDate(date, "MMM DD, HH:mm"),
    },
    {
      title: "Reviewed By",
      dataIndex: "reviewedBy",
      key: "reviewedBy",
      width: 120,
      render: (val: string | undefined) => val || <Text style={{ color: "#8c8c8c" }}>-</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: unknown, record: Approval) => (
        <Space size={4}>
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/approvals/${record.id}`)}
            />
          </Tooltip>
          {record.status === "pending" && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  style={{ color: "#52c41a" }}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button type="text" size="small" danger icon={<CloseOutlined />} />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle={`${pendingCount} pending approval${pendingCount !== 1 ? "s" : ""}`}
        breadcrumbs={[{ title: "Home", href: "/" }, { title: "Approvals" }]}
      />

      <Table
        dataSource={mockApprovals}
        columns={columns}
        rowKey="id"
        pagination={{
          total: mockApprovals.length,
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `${total} approvals`,
        }}
        style={{ background: "#fff", borderRadius: 10 }}
      />
    </div>
  );
};

export default ApprovalList;
