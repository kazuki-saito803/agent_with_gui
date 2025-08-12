// index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import SendButton from './components/sendButton'; // コンポーネント名を大文字で始める

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
    <SendButton type="submit" onClick={() => alert('送信しました！')}>送信</SendButton>
  </React.StrictMode>
);