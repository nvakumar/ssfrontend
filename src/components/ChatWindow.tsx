<<<<<<< HEAD
import { useState, useEffect, useRef, useMemo } from 'react';
=======
// src/components/ChatWindow.tsx
import { useState, useEffect, useRef } from 'react';
>>>>>>> fa3c2a3 (refactor: remove default React import, use hooks-only imports in all components and pages)
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';
import { Send } from 'lucide-react';

interface Participant {
  _id: string;
  fullName: string;
  avatar?: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
}

interface Message {
  _id: string;
  sender: string;
  text: string;
  createdAt: string;
}

interface ArrivalMessage {
  sender: string;
  text: string;
  createdAt: number;
}

interface ChatWindowProps {
  currentChat: Conversation;
}

const ChatWindow = ({ currentChat }: ChatWindowProps) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [arrivalMessage, setArrivalMessage] = useState<ArrivalMessage | null>(null);
  const socket = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize to avoid recalculating each render
  const otherParticipant = useMemo(
    () => currentChat.participants.find((p) => p._id !== user?._id),
    [currentChat.participants, user?._id]
  );

  // Connect to socket once on mount and setup listener
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'ws://localhost:5000';
    socket.current = io(SOCKET_URL);

    socket.current.on('getMessage', (data) => {
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        createdAt: Date.now(),
      });
    });

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  // Emit addUser event when user info is available
  useEffect(() => {
    if (user) {
      socket.current?.emit('addUser', user._id);
    }
  }, [user]);

  // Append new arrival message if it belongs to the current chat
  useEffect(() => {
    if (
      arrivalMessage &&
      currentChat?.participants.some((p) => p._id === arrivalMessage.sender)
    ) {
      setMessages((prev) => [
        ...prev,
        {
          _id: String(arrivalMessage.createdAt), // Generate temporary id
          sender: arrivalMessage.sender,
          text: arrivalMessage.text,
          createdAt: new Date(arrivalMessage.createdAt).toISOString(),
        },
      ]);
    }
  }, [arrivalMessage, currentChat]);

  // Fetch message history when currentChat changes
  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await api.get(`/api/messages/${currentChat._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    getMessages();
  }, [currentChat, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherParticipant || !user) return;

    const message = {
      conversationId: currentChat._id,
      sender: user._id,
      receiver: otherParticipant._id,
      text: newMessage,
    };

    // Send real-time message via socket
    socket.current?.emit('sendMessage', {
      senderId: user._id,
      receiverId: otherParticipant._id,
      text: newMessage,
    });

    try {
      // Save message to backend
      const res = await api.post('/api/messages', message, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b border-gray-700">
        <p className="font-semibold">{otherParticipant?.fullName || 'Conversation'}</p>
      </div>

      {/* Message History */}
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={m._id}
            ref={i === messages.length - 1 ? scrollRef : null}
            className={`flex mb-4 ${
              m.sender === user?._id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`py-2 px-4 rounded-lg max-w-md ${
                m.sender === user?._id ? 'bg-indigo-600' : 'bg-gray-700'
              }`}
            >
              <p>{m.text}</p>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {new Date(m.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input Form */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow p-3 text-white bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors"
            disabled={!newMessage.trim()}
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
