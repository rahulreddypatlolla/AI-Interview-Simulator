import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { evaluationMiddleware } from './server/evaluationApi'
import { voiceInterviewMiddleware } from './server/voiceInterviewApi'

function evaluationPlugin(): Plugin {
  return {
    name: 'server-evaluation-api',
    configureServer(server) {
      server.middlewares.use('/api/evaluate', (req, res) => {
        evaluationMiddleware(req, res)
      })
      server.middlewares.use('/api/voice-interview/evaluate', (req, res) => {
        voiceInterviewMiddleware(req, res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/evaluate', (req, res) => {
        evaluationMiddleware(req, res)
      })
      server.middlewares.use('/api/voice-interview/evaluate', (req, res) => {
        voiceInterviewMiddleware(req, res)
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), evaluationPlugin()],
  optimizeDeps: {
    include: ['react-is', 'recharts', 'lucide-react', 'react-router-dom'],
  },
  server: {
    port: 5173,
    host: true,
  },
})
