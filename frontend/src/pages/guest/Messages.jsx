import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, ArrowLeft } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function Messages() {
  const { user }                          = useAuth()
  const [conversations, setConversations] = useState([])
  const [active, setActive]              = useState(null)
  const [messages, setMessages]          = useState([])
  const [text, setText]                  = useState('')
  const [loading, setLoading]            = useState(true)
  const [sending, setSending]            = useState(false)
  const bottomRef                        = useRef(null)

  useEffect(() => {
    api.get('/messages/conversations')
      .then(r => setConversations(r.data.data || []))
      .catch(() => toast.error('Failed to load conversations'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!active) return
    api.get(`/messages/${active._id}`)
      .then(r => setMessages(r.data.data?.messages || []))
      .catch(() => toast.error('Failed to load messages'))
  }, [active])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/messages/${active._id}`, { content: text })
      setMessages(prev => [...prev, res.data.data])
      setText('')
      // Update last message in conversation list
      setConversations(prev => prev.map(c =>
        c._id === active._id ? { ...c, lastMessage: { content: text, createdAt: new Date() } } : c
      ))
    } catch { toast.error('Failed to send message') }
    finally  { setSending(false) }
  }

  const otherPerson = (conv) => conv.host._id === user.id ? conv.guest : conv.host

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10 text-gray-400">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="card overflow-hidden flex h-[600px]">

        {/* Conversation List */}
        <div className={`w-full sm:w-80 border-r border-gray-100 flex flex-col ${active ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-600">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>

          {conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <MessageCircle size={40} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Message a host from any property page</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {conversations.map(c => {
                const other = otherPerson(c)
                return (
                  <button key={c._id} onClick={() => setActive(c)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${active?._id === c._id ? 'bg-rose-50' : ''}`}>
                    <img src={other.avatar?.url || 'https://via.placeholder.com/40'} alt={other.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium text-gray-900 truncate">{other.name}</p>
                        {c.unreadCount?.[user.role === c.host._id ? 'host' : 'guest'] > 0 && (
                          <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{c.property?.title}</p>
                      {c.lastMessage?.content && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMessage.content}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Message View */}
        <div className={`flex-1 flex flex-col ${!active ? 'hidden sm:flex' : 'flex'}`}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
              <MessageCircle size={40} className="mb-3 text-gray-200" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setActive(null)} className="sm:hidden mr-1 text-gray-500">
                  <ArrowLeft size={20} />
                </button>
                <img src={otherPerson(active).avatar?.url || 'https://via.placeholder.com/40'} alt=""
                  className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="font-medium text-sm">{otherPerson(active).name}</p>
                  <p className="text-xs text-gray-400">{active.property?.title}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 mt-10">No messages yet. Say hi! 👋</div>
                ) : messages.map(m => {
                  const isMine = m.sender._id === user.id || m.sender === user.id
                  return (
                    <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <img src={m.sender?.avatar?.url || 'https://via.placeholder.com/30'} alt=""
                          className="w-7 h-7 rounded-full object-cover mr-2 mt-1 shrink-0" />
                      )}
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMine ? 'bg-rose-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      } ${m.isDeleted ? 'italic opacity-60' : ''}`}>
                        {m.content}
                        <p className={`text-xs mt-1 ${isMine ? 'text-rose-200' : 'text-gray-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-2">
                <input type="text" placeholder="Type a message..." className="input-field flex-1"
                  value={text} onChange={e => setText(e.target.value)} />
                <button type="submit" disabled={sending || !text.trim()} className="btn-primary px-4">
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}