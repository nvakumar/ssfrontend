import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { Send, XCircle } from 'lucide-react';

interface Participant {
  _id: string;
  fullName: string;
  avatar?: string;
  role: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  sender: Participant;
  receiver: string; // receiver id
  text: string;
  createdAt: string;
}

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!token) {
      setError('Not authenticated. Please log in.');
      setIsLoadingConversations(false);
      return;
    }
    setIsLoadingConversations(true);
    setError('');
    try {
      const response = await api.get('/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to load conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Effect to handle "with" query param to start or select conversation
  useEffect(() => {
    let isMounted = true;
    const recipientId = searchParams.get('with');

    const createNewConversation = async () => {
      if (!token || !recipientId) return;

      try {
        setIsCreatingConversation(true);
        const response = await api.post(
          '/api/messages/conversations',
          { receiverId: recipientId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!isMounted) return;
        setConversations((prev) => {
          const exists = prev.some((conv) => conv._id === response.data._id);
          return exists ? prev : [response.data, ...prev];
        });
        setSelectedConversation(response.data);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Failed to start new conversation.");
      } finally {
        if (isMounted) setIsCreatingConversation(false);
        navigate('/messages', { replace: true });
      }
    };

    if (recipientId && currentUser && recipientId !== currentUser._id && !isCreatingConversation) {
      const existingConv = conversations.find(
        (conv) => conv.participants.some((p) => p._id === recipientId && p._id !== currentUser._id)
      );
      if (existingConv) {
        setSelectedConversation(existingConv);
        navigate('/messages', { replace: true });
      } else {
        createNewConversation();
      }
    } else if (recipientId && currentUser && recipientId === currentUser._id) {
      navigate('/messages', { replace: true });
    }

    return () => {
      isMounted = false;
    };
  }, [searchParams, conversations, currentUser, token, navigate, isCreatingConversation]);

  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      if (!selectedConversation || !token) {
        setMessages([]);
        return;
      }
      setIsLoadingMessages(true);
      setError('');
      try {
        const response = await api.get(`/api/messages/${selectedConversation._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted) return;
        setMessages(response.data);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Failed to load messages.");
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    fetchMessages();
    return () => {
      isMounted = false;
    };
  }, [selectedConversation, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConversation || !currentUser || !token) return;

    try {
      const recipient = selectedConversation.participants.find((p) => p._id !== currentUser._id);
      if (!recipient) {
        setError("Recipient not found in conversation.");
        return;
      }

      const response = await api.post(
        '/api/messages',
        {
          conversationId: selectedConversation._id,
          receiver: recipient._id,
          text: newMessageText,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, { ...response.data, sender: currentUser }]);
      setNewMessageText('');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to send message.");
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== currentUser?._id);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Header />
      <main className="pt-16 flex-grow container mx-auto px-4 flex">
        <LeftSidebar />

        <div className="flex-grow p-4 flex bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Conversations Sidebar */}
          <div className="w-1/3 border-r border-gray-700 pr-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Conversations</h2>

            {isLoadingConversations ? (
              <p className="text-gray-400" role="status" aria-live="polite">
                Loading conversations...
              </p>
            ) : error ? (
              <p className="text-red-400 flex items-center" role="alert">
                <XCircle size={16} className="mr-2" /> {error}
              </p>
            ) : conversations.length > 0 ? (
              <div className="flex-grow overflow-y-auto space-y-2">
                {conversations.map((conv) => {
                  const otherParticipant = getOtherParticipant(conv);
                  if (!otherParticipant) return null;
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors duration-200 ${
                        selectedConversation?._id === conv._id
                          ? 'bg-indigo-700'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      aria-pressed={selectedConversation?._id === conv._id}
                      type="button"
                    >
                      <img
                        src={
                          otherParticipant.avatar ||
                          `https://placehold.co/50x50/1a202c/ffffff?text=${otherParticipant.fullName.charAt(0)}`
                        }
                        alt={otherParticipant.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-white">{otherParticipant.fullName}</p>
                        <p className="text-sm text-gray-400">{otherParticipant.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400">
                No conversations yet. Message someone from their profile!
              </p>
            )}
          </div>

          {/* Message Window */}
          <div className="w-2/3 pl-4 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="border-b border-gray-700 pb-4 mb-4">
                  <h3 className="text-xl font-bold text-white">
                    Chat with {getOtherParticipant(selectedConversation)?.fullName}
                  </h3>
                </div>
                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                  {isLoadingMessages ? (
                    <p className="text-gray-400">Loading messages...</p>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${
                          msg.sender._id === currentUser?._id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.sender._id === currentUser?._id
                              ? 'bg-indigo-600'
                              : 'bg-gray-700'
                          }`}
                        >
                          <p className="text-sm text-white">{msg.text}</p>
                          <p className="text-xs text-gray-400 mt-1 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center">Start a new conversation!</p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="mt-4 flex space-x-2">
                  <textarea
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={1}
                    className="flex-grow p-3 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!newMessageText.trim()}
                    className="p-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 text-white"
                    aria-label="Send message"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-400">
                Select a conversation or start a new one.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
