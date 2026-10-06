import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  return {
    root: `${root}web`,
    envDir: root,
    plugins: [
      {
        name: 'native-source-for-browser',
        enforce: 'pre',
        async transform(code, id) {
          if (!id.startsWith(`${root}src/`) || !id.endsWith('.js')) return;
          // Metro image requires become browser asset URLs without editing native source.
          code = code.replace(
            /require\((['"])([^'"]+\.(?:png|jpe?g|webp))\1\)/g,
            (_, quote, asset) =>
              `({ uri: new URL('${asset}', import.meta.url).href })`,
          );
          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          });
        },
      },
      react({ babel: { babelrc: false, configFile: false } }),
    ],
    resolve: {
      alias: [
        { find: /^react-native$/, replacement: `${root}web/reactNative.js` },
      ],
      extensions: [
        '.web.tsx',
        '.web.ts',
        '.web.jsx',
        '.web.js',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.mjs',
        '.json',
      ],
      dedupe: ['react', 'react-dom'],
    },
    define: {
      global: 'globalThis',
      __DEV__: mode !== 'production',
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' },
        resolveExtensions: ['.web.js', '.js', '.ts', '.tsx', '.json'],
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      fs: { allow: [root] },
      // Explicit local proxy; production needs backend CORS or an equivalent host proxy.
      proxy: {
        '/api': {
          target:
            env.WEB_API_PROXY_TARGET || 'https://dairy-be-t8gm.onrender.com',
          changeOrigin: true,
          proxyTimeout: 20000,
          timeout: 25000,
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
    build: { outDir: `${root}dist-web`, emptyOutDir: true, target: 'safari15' },
  };
});
