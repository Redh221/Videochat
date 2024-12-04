// useChat.tsx
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface ChatMessage {
  userName: string;
  chatState: string;
}

export function useChat(socket: Socket | null, userName: string) {
  const [chatState, setChatState] = useState("");
  const [chatBoxState, setChatBoxState] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: ChatMessage) => {
      setChatBoxState((prev) => [...prev, data]);
    };

    socket.on("chat message", handleChatMessage);

    return () => {
      socket.off("chat message", handleChatMessage);
    };
  }, [socket]);

  const sendMessage = () => {
    if (chatState.trim() && socket) {
      socket.emit("chat message", { chatState, userName });
      setChatState("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatState(e.target.value);
  };

  return {
    chatState,
    chatBoxState,
    handleInputChange,
    sendMessage,
  };
}
