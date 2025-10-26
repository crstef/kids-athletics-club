import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PaperPlaneRight, ChatCircleDots } from '@phosphor-icons/react'
import { getAvatarColor, getInitials } from '@/lib/utils'
import { User, Message } from '@/lib/types'

interface ConversationSummary {
  user: User
  lastMessage?: Message
  hasHistory: boolean
  unreadCount: number
}

interface MessagingPanelProps {
  currentUserId: string
  users: User[]
  messages: Message[]
  onSendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  onMarkAsRead: (messageIds: string[]) => void
}

export function MessagingPanel({ 
  currentUserId, 
  users,
  messages,
  onSendMessage,
  onMarkAsRead
}: MessagingPanelProps) {
  const [newMessage, setNewMessage] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null)

  const conversations = useMemo<ConversationSummary[]>(() => {
    const summaries = new Map<string, ConversationSummary>()

    messages.forEach((message) => {
      const otherUserId = message.fromUserId === currentUserId ? message.toUserId : message.fromUserId
      const otherUser = users.find((u) => u.id === otherUserId)
      if (!otherUser) return

      const existing = summaries.get(otherUserId)
      const unreadIncrement = message.fromUserId === otherUserId && !message.read ? 1 : 0

      if (!existing) {
        summaries.set(otherUserId, {
          user: otherUser,
          lastMessage: message,
          hasHistory: true,
          unreadCount: unreadIncrement
        })
        return
      }

      if (!existing.lastMessage || new Date(existing.lastMessage.timestamp) < new Date(message.timestamp)) {
        existing.lastMessage = message
      }
      existing.hasHistory = true
      existing.unreadCount += unreadIncrement
    })

    users
      .filter((user) => user.id !== currentUserId)
      .forEach((user) => {
        if (!summaries.has(user.id)) {
          summaries.set(user.id, {
            user,
            hasHistory: false,
            unreadCount: 0
          })
        }
      })

    return Array.from(summaries.values()).sort((a, b) => {
      if (a.hasHistory !== b.hasHistory) {
        return a.hasHistory ? -1 : 1
      }

      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      }

      return `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`)
    })
  }, [messages, users, currentUserId])

  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0].user.id)
    }
  }, [conversations, selectedConversation])

  const selectedUser = useMemo(() => {
    if (!selectedConversation) return null
    return users.find((u) => u.id === selectedConversation) || null
  }, [selectedConversation, users])

  const conversationMessages = useMemo(() => {
    if (!selectedConversation) return [];
    return messages
      .filter(m => 
        (m.fromUserId === currentUserId && m.toUserId === selectedConversation) ||
        (m.fromUserId === selectedConversation && m.toUserId === currentUserId)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [messages, currentUserId, selectedConversation])

  const unreadMessages = useMemo(() => {
    if (!selectedConversation) return [];
    return conversationMessages.filter(m => 
      m.fromUserId === selectedConversation && m.toUserId === currentUserId && !m.read
    )
  }, [conversationMessages, currentUserId, selectedConversation])

  useEffect(() => {
    if (unreadMessages.length > 0) {
      onMarkAsRead(unreadMessages.map(m => m.id))
    }
  }, [unreadMessages, onMarkAsRead])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversationMessages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) {
      toast.error('Selectează o conversație și scrie un mesaj.')
      return
    }

    onSendMessage({
      fromUserId: currentUserId,
      toUserId: selectedConversation,
      content: newMessage,
      read: false
    })
    setNewMessage('')
  }

  return (
    <Card className="h-[70vh] flex">
      <div className="w-1/3 border-r">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChatCircleDots size={24} />
            Conversații
          </CardTitle>
        </CardHeader>
        <ScrollArea className="h-[calc(70vh-80px)]">
          {conversations.map(({ user, lastMessage, hasHistory, unreadCount }) => (
            <div 
              key={user.id} 
              className={`p-3 cursor-pointer hover:bg-muted/50 ${selectedConversation === user.id ? 'bg-muted' : ''}`}
              onClick={() => setSelectedConversation(user.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <div 
                    className="w-full h-full flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: getAvatarColor(user.id) }}
                  >
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {hasHistory && lastMessage
                      ? lastMessage.content
                      : 'Începe o conversație'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="w-2/3 flex flex-col">
        {selectedUser ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <div 
                    className="w-full h-full flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: getAvatarColor(selectedUser.id) }}
                  >
                    {getInitials(selectedUser.firstName, selectedUser.lastName)}
                  </div>
                </Avatar>
                <div>
                  <CardTitle>{selectedUser.firstName} {selectedUser.lastName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedUser.role}</p>
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {conversationMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-end gap-2 ${
                      message.fromUserId === currentUserId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.fromUserId !== currentUserId && (
                      <Avatar className="w-8 h-8">
                        <div 
                          className="w-full h-full flex items-center justify-center font-bold text-white text-xs"
                          style={{ backgroundColor: getAvatarColor(selectedUser.id) }}
                        >
                          {getInitials(selectedUser.firstName, selectedUser.lastName)}
                        </div>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${
                        message.fromUserId === currentUserId
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-word">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="relative">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Scrie un mesaj..."
                  className="pr-12"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <PaperPlaneRight size={20} weight="fill" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Selectează o conversație pentru a vedea mesajele.</p>
          </div>
        )}
      </div>
    </Card>
  )
}
