import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Building,
  ShieldCheck,
  Check,
  CheckCheck,
  Phone,
  Search,
  ArrowLeft,
  User as UserIcon
} from 'lucide-react';
import { Conversation, Message } from '../types';
import { api } from '../services/api';
import { useAuth } from '../store/authContext';
import { useToast } from '../components/common/Toast';

export const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvParam = searchParams.get('conv');
  const { user } = useAuth();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConvParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = async (keepSelection = true) => {
    try {
      const res = await api.getConversations();
      const list: Conversation[] = res.conversations || [];
      setConversations(list);

      if (list.length > 0 && !selectedConvId && !keepSelection) {
        setSelectedConvId(list[0].id);
        setSearchParams({ conv: list[0].id });
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations(false);
  }, []);

  // Update selected if url param changes
  useEffect(() => {
    if (activeConvParam) {
      setSelectedConvId(activeConvParam);
    } else if (conversations.length > 0 && !selectedConvId) {
      setSelectedConvId(conversations[0].id);
    }
  }, [activeConvParam, conversations]);

  // Load messages for selected conversation
  const loadMessages = async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.getMessages(convId);
      setMessages(res.messages || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load messages', 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    }
  }, [selectedConvId]);

  // Polling for live messages
  useEffect(() => {
    if (!selectedConvId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.getMessages(selectedConvId);
        setMessages(res.messages || []);
      } catch (e) {
        // silent
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await api.sendMessage(selectedConvId, content);
      setMessages(prev => [...prev, res.message]);
      loadConversations(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.otherUser?.name.toLowerCase().includes(query) ||
      c.property?.title.toLowerCase().includes(query) ||
      c.lastMessage?.content.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-zinc-50/50 min-h-[calc(100vh-4rem)] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[700px] h-[calc(100vh-8rem)]">
          {/* Left Pane: Conversations List */}
          <div className={`md:col-span-4 border-r border-zinc-200 flex flex-col ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <span>Inbox Messages</span>
              </h2>

              {/* Search Bar */}
              <div className="relative mt-3">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            {/* Conversation Threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {isLoadingList ? (
                <div className="p-8 text-center text-xs text-zinc-400">Loading chats...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  No conversations found. Inquire about properties or message hosts to chat.
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isSelected = conv.id === selectedConvId;
                  return (
                    <div
                      key={conv.id}
                      id={`conv-item-${conv.id}`}
                      onClick={() => {
                        setSelectedConvId(conv.id);
                        setSearchParams({ conv: conv.id });
                      }}
                      className={`p-4 hover:bg-zinc-50 cursor-pointer transition-colors flex items-start gap-3 ${
                        isSelected ? 'bg-emerald-50/50 border-l-4 border-emerald-600' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-zinc-100 ring-1 ring-zinc-200 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-zinc-500" />
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-zinc-900 truncate">
                            {conv.otherUser?.name}
                          </h4>
                          <span className="text-[10px] text-zinc-400">
                            {conv.lastMessage?.createdAt
                              ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>

                        {conv.property && (
                          <span className="text-[11px] text-emerald-700 font-medium truncate block mt-0.5">
                            🏠 {conv.property.title}
                          </span>
                        )}

                        <p className="text-xs text-zinc-500 truncate mt-1">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Active Chat */}
          <div className={`md:col-span-8 flex flex-col bg-zinc-50/30 ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
            {selectedConv ? (
              <>
                {/* Chat Top Header */}
                <div className="p-4 border-b border-zinc-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConvId(null)}
                      className="md:hidden p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-zinc-100 ring-1 ring-zinc-200 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-zinc-900">{selectedConv.otherUser?.name}</h3>
                        {selectedConv.otherUser?.isVerified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        )}
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded capitalize bg-zinc-100 text-zinc-700">
                          {selectedConv.otherUser?.role}
                        </span>
                      </div>
                      {selectedConv.otherUser?.phone && (
                        <p className="text-[11px] text-zinc-500">{selectedConv.otherUser.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Associated Property Badge/Link */}
                  {selectedConv.property && (
                    <Link
                      to={`/properties/${selectedConv.property.id}`}
                      className="hidden sm:flex items-center gap-2 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200 text-xs transition-colors"
                    >
                      <img
                        src={selectedConv.property.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=80&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div className="text-left">
                        <div className="font-semibold text-zinc-900 truncate max-w-[140px]">{selectedConv.property.title}</div>
                        <div className="text-[11px] text-emerald-700 font-bold">{selectedConv.property.price.toLocaleString()} ETB</div>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                  {isLoadingMessages ? (
                    <div className="text-center py-10 text-xs text-zinc-400">Loading chat history...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 text-xs text-zinc-400">
                      Send a message to begin discussing details with {selectedConv.otherUser?.name}.
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-br-none'
                                : 'bg-white text-zinc-800 rounded-bl-none border border-zinc-200'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400 px-1">
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              msg.isRead ? (
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Check className="w-3 h-3 text-zinc-400" />
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Box */}
                <div className="p-4 bg-white border-t border-zinc-200">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      id="input-chat-message"
                      type="text"
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
                    />
                    <button
                      id="btn-send-message"
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl transition-colors shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-3xl flex items-center justify-center text-zinc-400 mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">Select a conversation</h3>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">
                  Choose a chat from the left panel to message landlords or respond to rental inquiries.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
