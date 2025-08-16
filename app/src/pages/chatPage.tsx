import React from 'react';
import SubmitButton from '../features/submitButton';
import MessageInput from '../components/messageInput';


const chatPage: React.FC = () => {
  return (
    <>
        <div className='inputContainer'>
            <MessageInput className='messageInput' type="text" placeholder="Enter text"></MessageInput>
            <SubmitButton />
        </div>
    </>
  );
}

export default chatPage;