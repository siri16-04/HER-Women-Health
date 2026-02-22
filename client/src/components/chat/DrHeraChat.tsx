import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { wellnessApi, periodApi, sessionsApi } from '../../services/supabaseApi'

interface Message {
    id: string
    role: 'user' | 'assistant'
    text: string
    timestamp: Date
}

export default function DrHeraChat() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            text: "Hello, I'm Dr. Her. I can help analyze your health patterns based on your logs. How are you feeling today?",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const fetchContext = async () => {
        try {
            const [todayWellness, periodLogs, recentSessions] = await Promise.all([
                wellnessApi.getToday(),
                periodApi.getAll().then(logs => logs.slice(0, 3)), // Last 3 periods
                sessionsApi.getAll().then((sessions: any[]) => sessions.slice(0, 3)) // Last 3 scans
            ])

            return {
                userProfile: {
                    id: user?.id,
                    email: user?.email
                },
                currentDate: new Date().toISOString().split('T')[0],
                wellnessToday: todayWellness,
                recentPeriods: periodLogs,
                recentScans: recentSessions.map((s: any) => ({
                    date: s.created_at,
                    vitals: s.biometric_summary,
                    diagnosis: s.diagnosis_result
                }))
            }
        } catch (err) {
            console.error('Failed to fetch context:', err)
            return {}
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const context = await fetchContext()

            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}` // If we add auth midware later
                },
                body: JSON.stringify({
                    message: userMsg.text,
                    context
                })
            })

            const data = await response.json()

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: data.response || data.error || "I'm having trouble connecting right now. Please try again later.",
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (err) {
            console.error('Chat error:', err)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                text: "I'm having trouble connecting right now. Please try again later.",
                timestamp: new Date()
            }])
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-200">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Dr. Her</h3>
                                <p className="text-xs text-teal-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-teal-600 text-white rounded-tr-none'
                                        : 'bg-white text-neutral-700 border border-neutral-100 rounded-tl-none'
                                        }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm max-w-none text-neutral-700 space-y-2">
                                            {msg.text.split('\n').map((line, i) => (
                                                <p key={i} className="m-0 min-h-[1em]">{line}</p>
                                            ))}
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-neutral-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-neutral-100 shrink-0">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask Dr. Her..."
                                className="w-full pl-4 pr-12 py-3 bg-neutral-100 border-transparent focus:bg-white focus:border-teal-500 rounded-xl text-sm transition-all focus:ring-2 focus:ring-teal-100 outline-none"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="absolute right-2 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:bg-neutral-300 transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-neutral-400 mt-2">
                            AI assistant requires internet. Not medical advice.
                        </p>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className={`group pointer-events-auto p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'bg-neutral-800 rotate-90' : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:shadow-teal-500/30'
                    }`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-teal-500 rounded-full"></span>
                    </div>
                )}
            </button>
        </div>
    )
}
