/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Fix for Supabase WebSocket warnings and build issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // ✅ Fix: Add fallbacks for Node.js modules that don't work in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        child_process: false,
        tls: false,
        ws: false,
        // ✅ Fix: Specifically handle bufferutil and utf-8-validate from ws package
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
      // ✅ Suppress warnings about optional dependencies
      {
        module: /node_modules\/ws/,
        message: /Module not found: Error: Can't resolve 'bufferutil'/,
      },
      {
        module: /node_modules\/ws/,
        message: /Module not found: Error: Can't resolve 'utf-8-validate'/,
      },
    ];
    
    return config;
  },
}

module.exports = nextConfig