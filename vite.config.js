import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  return {
    plugins: [react()],
    define: isProduction
      ? {
          'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
            'https://grocery-choice-backend-production-97c7.up.railway.app'
          )
        }
      : {},
    server: {
      port: 5173,
      host: '127.0.0.1',
      strictPort: true
    }
  };
})

