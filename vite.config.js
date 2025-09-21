import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/sammirack-test2/", // 이 부분을 추가해주세요.
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // 프린트 관련 컴포넌트를 별도 청크로 분리하지 않음
          vendor: ['react', 'react-dom', 'react-router-dom']
        },
        assetFileNames: (assetInfo) => {
          // CSS 파일명을 예측 가능하게 설정
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    cssCodeSplit: false, // CSS 코드 스플리팅 비활성화로 스타일 로딩 문제 방지
  },
  css: {
    postcss: {
      plugins: [
        // PostCSS 플러그인 설정
      ]
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173,
    open: true
  }
})
