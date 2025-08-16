import React, { useState, useRef, useEffect } from 'react';
import SubmitButton from '../features/submitButton';
import MessageInput from '../components/messageInput';
import useFetchResponse from '../hooks/uesFetchResponse';
import '../styles/chatPage.css';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const ChatPage: React.FC = () => {
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { loading, fetchResponse } = useFetchResponse();
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 最新メッセージまでスクロール
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputVal.trim()) return;

    const userInput = inputVal;
    setMessages(prev => [...prev, { sender: 'user', text: userInput }]);
    setInputVal("");

    try {
      // fetchResponseでBotの回答を取得
      const botReply = await fetchResponse({
        question: userInput,
        top_k: 3,
        index_name: 'test',
      });

      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error: 取得できませんでした' }]);
    }
  };

  return (
    <>
      <div className="messageContainer">
        {messages.map((msg, idx) => (
          <p key={idx} className={msg.sender}>
            {msg.text}
          </p>
        ))}
        <div ref={messageEndRef} />
      </div>

      <div className='inputContainer'>
        <MessageInput
          className="messageInput"
          type="text"
          placeholder="Enter text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
        />
        <SubmitButton onClick={handleSend} disabled={loading}>
          {loading ? 'Loading...' : 'Send'}
        </SubmitButton>
      </div>
    </>
  );
};

export default ChatPage;