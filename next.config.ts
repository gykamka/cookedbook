import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发时允许同一个 Wi-Fi 里的手机打开（npm run dev 之后用电脑的局域网地址访问）
  allowedDevOrigins: ["192.168.31.83", "192.168.*.*"],
};

export default nextConfig;
