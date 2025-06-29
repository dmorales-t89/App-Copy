/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // ✅ Fix for Supabase WebSocket warnings and build issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        child_process: false,
        tls: false,
        ws: false,
        // ✅ Additional fallbacks for Supabase dependencies
        bufferutil: false,
        'utf-8-validate': false,
      };
    }
    
    // ✅ Suppress specific warnings from Supabase realtime
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    
    return config;
  },
}

module.exports = nextConfig