import React from 'react';
import { ChatMessage } from './chat-message';
import { Message } from '@/lib/types';

export const ChatPanel = ({
  chat,
  initialMessage,
}: {
  chat?: Message[];
  initialMessage?: Message | null;
}) => {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);
  if (chat) {
    return (
      <>
        {chat.map((message, index) => (
          <ChatMessage
            key={message.id}
            {...message}
            last={index === chat.length - 1}
          />
        ))}
        <div ref={endRef} />
      </>
    );
  }

  if (initialMessage) {
    return <ChatMessage {...initialMessage} />;
  }

  return null;
};
