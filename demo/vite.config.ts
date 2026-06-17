import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-rerender-hook': path.resolve(__dirname, '../src/index.ts'),
    },
  },
})
