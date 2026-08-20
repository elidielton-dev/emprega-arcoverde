/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // pdf-parse/pdfjs-dist quebram se o Webpack empacotar no RSC
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      const externals = ["pdf-parse", "pdfjs-dist", "mammoth"];
      if (Array.isArray(config.externals)) {
        config.externals.push(...externals);
      }
    }
    return config;
  },
};

export default nextConfig;
