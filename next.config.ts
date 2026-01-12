import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["opentimestamps", "bitcore-lib"],
};

export default nextConfig;
