// src/App.tsx
import React from 'react';
import { PromptBuilder } from './components/PromptBuilder';

function App() {
  return (
    <div className="App">
      <header style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white' }}>
        <h1>オブジェクト指向プロンプトビルダー (モック)</h1>
      </header>
      <main>
        <PromptBuilder />
      </main>
    </div>
  );
}

export default App;