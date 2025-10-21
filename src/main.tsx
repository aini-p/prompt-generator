import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// 1. index.html の #root 要素を取得
const rootElement = document.getElementById('root');

if (rootElement) {
  // 2. Reactに、#root の中に App コンポーネントを描画するよう指示
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  console.error("Failed to find the root element. Check your index.html file.");
}