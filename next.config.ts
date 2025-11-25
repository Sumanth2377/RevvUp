/** @type {import('next').NextConfig} */
const nextConfig = {
    // This is to allow the Next.js dev server to accept requests from the
    // Firebase Studio preview iframe.
    // In a future version of Next.js, this may be required for HMR to work.
    devIndicators: {
        buildActivity: false,
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
