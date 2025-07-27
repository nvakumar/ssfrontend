// src/components/ChatWindow.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';
import { Send } from 'lucide-react';

// Define shapes for our data
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
interface ChatWindowProps {
  currentChat: Conversation;
}

const ChatWindow = ({ currentChat }: ChatWindowProps) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [arrivalMessage, setArrivalMessage] = useState<any>(null);
  const socket = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const otherParticipant = currentChat.participants.find(p => p._id !== user?._id);

  // Effect for Socket.IO connection and real-time messages
  useEffect(() => {
    // Connect to the socket server
    socket.current = io("ws://localhost:5000"); // Use your backend URL

    // Listen for incoming messages
    socket.current.on("getMessage", (data) => {
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        createdAt: Date.now(),
      });
    });

    // Clean up the connection when the component unmounts
    return () => {
      socket.current?.disconnect();
    };
  }, []);

  // Effect to add a user to the online list
  useEffect(() => {
    if (user) {
      socket.current?.emit("addUser", user._id);
    }
  }, [user]);

  // Effect to add the newly arrived message to the messages state
  useEffect(() => {
    if (arrivalMessage && currentChat?.participants.some(p => p._id === arrivalMessage.sender)) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage, currentChat]);

  // Effect to fetch message history
  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await api.get(`/api/messages/${currentChat._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    getMessages();
  }, [currentChat, token]);

  // Effect to scroll to the bottom of the chat on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherParticipant) return;

    const message = {
      conversationId: currentChat._id,
      sender: user?._id,
      receiver: otherParticipant._id,
      text: newMessage,
    };

    // Send message to socket server for real-time delivery
    socket.current?.emit("sendMessage", {
      senderId: user?._id,
      receiverId: otherParticipant._id,
      text: newMessage,
    });

    try {
      // Save message to the database
      const res = await api.post("/api/messages", message, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([...messages, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b border-gray-700">
        <p className="font-semibold">{otherParticipant?.fullName}</p>
      </div>
      {/* Message History */}
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((m) => (
          <div key={m._id} ref={scrollRef} className={`flex mb-4 ${m.sender === user?._id ? 'justify-end' : 'justify-start'}`}>
            <div className={`py-2 px-4 rounded-lg max-w-md ${m.sender === user?._id ? 'bg-indigo-600' : 'bg-gray-700'}`}>
              <p>{m.text}</p>
              <p className="text-xs text-gray-400 mt-1 text-right">{new Date(m.createdAt).toLocaleTimeString()}</p>
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
          <button type="submit" className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors">
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
