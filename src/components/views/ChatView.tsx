import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Hash,
  Send,
  Paperclip,
  Smile,
  ShieldCheck,
  Lock,
  Bot,
  Users,
  CheckCheck,
  Radio,
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const {
    t,
    state,
    activeChannelId,
    setActiveChannelId,
    sendMessage,
    toggleReaction,
    currentUser,
    hasPermission,
  } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel =
    state.chatChannels.find((c) => c.id === activeChannelId) || state.chatChannels[0];

  const channelMessages = state.chatMessages.filter(
    (m) => m.channelId === activeChannelId
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [channelMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedAttachment) return;

    const attachments = selectedAttachment
      ? [{ name: selectedAttachment, type: 'document', url: '#' }]
      : [];

    sendMessage(messageInput, activeChannelId, attachments);
    setMessageInput('');
    setSelectedAttachment(null);
  };

  const isRestrictedChannel = activeChannel.isPrivate;
  const canAccessChannel =
    !isRestrictedChannel ||
    currentUser.role === 'super_admin' ||
    currentUser.role === 'compliance_officer';

  return (
    <div
      id="chat-view"
      className="flex h-[calc(100vh-140px)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden animate-in fade-in duration-150"
    >
      {/* Channels & Team Roster Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Team Communications
          </span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>

        {/* Channels List */}
        <div className="p-2 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Channels
          </div>
          {state.chatChannels.map((chan) => {
            const isActive = chan.id === activeChannelId;
            return (
              <button
                key={chan.id}
                onClick={() => setActiveChannelId(chan.id)}
                className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {chan.isPrivate ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  ) : (
                    <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  )}
                  <span className="truncate">{chan.name}</span>
                </div>
              </button>
            );
          })}

          {/* Online Teammates List */}
          <div className="pt-3 px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Team Online ({state.users.length})
          </div>
          {state.users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <div className="relative shrink-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span
                  className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ring-1 ring-white dark:ring-slate-900 ${
                    user.status === 'active'
                      ? 'bg-emerald-500'
                      : user.status === 'busy'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate text-[11px] leading-tight text-slate-800 dark:text-slate-200">
                  {user.name}
                </p>
                <p className="text-[9px] text-slate-400 truncate leading-tight">
                  {user.department}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        {/* Channel Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            {activeChannel.isPrivate ? (
              <Lock className="h-4 w-4 text-amber-500" />
            ) : (
              <Hash className="h-4 w-4 text-indigo-500" />
            )}
            <div>
              <h2 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {activeChannel.name}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {activeChannel.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>WebSocket Live Broadcast</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {!canAccessChannel ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
              <Lock className="h-10 w-10 text-amber-500 mb-2 opacity-60" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Restricted Governance Channel
              </h3>
              <p className="text-xs max-w-sm mt-1">
                This channel handles HIPAA ePHI audits and GDPR DSAR compliance events.
                Switch your active role to <span className="text-indigo-400 font-semibold">Compliance Officer</span> or <span className="text-indigo-400 font-semibold">Super Admin</span> in the top header to inspect this room.
              </p>
            </div>
          ) : channelMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 text-xs">
              <Hash className="h-8 w-8 opacity-20 mb-2" />
              <span>No messages in this channel yet. Start the conversation!</span>
            </div>
          ) : (
            channelMessages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;

              if (msg.isSystemEvent) {
                return (
                  <div
                    key={msg.id}
                    className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs flex items-center gap-2 text-indigo-900 dark:text-indigo-200"
                  >
                    <Bot className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="flex-1 font-mono text-[11px]">{msg.content}</span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 text-xs ${
                    isMine ? 'flex-row-reverse' : ''
                  }`}
                >
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="h-8 w-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                  />
                  <div
                    className={`max-w-md rounded-2xl p-3 space-y-1 shadow-xs ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-80">
                      <span className="font-semibold">{msg.senderName}</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {/* Attachment preview */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="pt-1">
                        {msg.attachments.map((att: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 p-1.5 rounded bg-black/10 text-[11px] font-mono truncate"
                          >
                            <Paperclip className="h-3 w-3" />
                            <span className="truncate">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Emoji Reactions Bar */}
                    <div className="flex items-center gap-1 pt-1">
                      {['👍', '🚀', '🔥', '✅'].map((emoji) => {
                        const reaction = msg.reactions?.find((r) => r.emoji === emoji);
                        const count = reaction?.users.length || 0;
                        const hasReacted = reaction?.users.includes(currentUser.id);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className={`px-1.5 py-0.5 rounded-full text-[10px] border transition-colors ${
                              hasReacted
                                ? 'bg-indigo-500/20 border-indigo-400 text-white font-bold'
                                : 'border-transparent hover:bg-black/10 text-slate-300'
                            }`}
                          >
                            {emoji} {count > 0 && count}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        {canAccessChannel && (
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-2"
          >
            {selectedAttachment && (
              <div className="flex items-center justify-between px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300">
                <span className="truncate">Attached: {selectedAttachment}</span>
                <button
                  type="button"
                  onClick={() => setSelectedAttachment(null)}
                  className="text-indigo-400 hover:text-indigo-600 font-bold ml-2"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message #${activeChannel.name}...`}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <button
                type="button"
                onClick={() => setSelectedAttachment('Trial_Protocol_Summary_v4.pdf')}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Attach Document"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="submit"
                className="flex items-center justify-center p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
                title="Send Message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
