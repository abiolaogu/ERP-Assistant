import type { ThemeConfig } from "antd";

const theme: ThemeConfig = {
  token: {
    colorPrimary: "#0f6fa8",
    borderRadius: 10,
    fontFamily:
      "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f0f5ff",
  },
  components: {
    Layout: {
      siderBg: "#001529",
      headerBg: "#ffffff",
    },
    Menu: {
      darkItemBg: "#001529",
      darkSubMenuItemBg: "#000c17",
    },
    Card: {
      borderRadiusLG: 10,
    },
  },
};

export default theme;
