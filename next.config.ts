import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { webpack, isServer }) {
    /* pptxgenjs (PowerPoint export) imports "node:fs" / "node:https" for its Node build.
     * Strip the "node:" scheme so webpack resolves them normally; in the browser they are empty. */
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        (r: { request: string }) => {
          r.request = r.request.replace(/^node:/, "");
        },
      ),
    );
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
