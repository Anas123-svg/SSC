import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { watch: { ignored: ['**/artifacts/**', '**/test-results/**'] } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replaceAll('\\', '/');
          if (!path.includes('/node_modules/')) return;
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(path)) return 'react';
          if (/\/node_modules\/(docx|mammoth|jszip|@zip\.js|fflate|xml|sax|pako|lop|bluebird|underscore|base64-js|buffer|immediate|lie|readable-stream|safe-buffer|string_decoder|core-util-is|isarray|process-nextick-args|util-deprecate|inherits|setimmediate|xmlbuilder|@xmldom)\//.test(path)) return 'document-conversion';
          if (/\/node_modules\/(@tiptap|prosemirror-[^/]+|orderedmap|rope-sequence|w3c-keyname|crelt)\//.test(path)) return 'document-editor';
          return 'vendor';
        },
      },
    },
  },
});
