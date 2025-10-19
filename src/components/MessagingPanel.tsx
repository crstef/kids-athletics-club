import { useState, useMemo, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatCircleDots, PaperPlaneRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getInitials, getAvatarColor } from '@/lib/constants'
import type { Message, User, Athlete } from '@/lib/types'

interface MessagingPanelProps {
  currentUserId: string
  otherUserId: string
  otherUser: User | undefined
  athlete?: Athlete
  messages: Message[]
  onSendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  onMarkAsRead: (messageIds: string[]) => void
}

export function MessagingPanel({ 
  currentUserId, 
  otherUserId,
  otherUser,
  athlete,
  messages,
  onSendMessage,
  onMarkAsRead
}: MessagingPanelProps) {
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const conversationMessages = useMemo(() => {
    return messages
      .filter(m => 
        (m.fromUserId === currentUserId && m.toUserId === otherUserId) ||
        (m.fromUserId === otherUserId && m.toUserId === currentUserId)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [messages, currentUserId, otherUserId])

  const unreadMessages = useMemo(() => {
    return conversationMessages.filter(m => 
      m.fromUserId === otherUserId && m.toUserId === currentUserId && !m.read
    )
  }, [conversationMessages, currentUserId, otherUserId])

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) {
      toast.error('Mesajul nu poate fi gol')
      return
    }

    if (!otherUserId) {
      toast.error('Selectează un destinatar')
      return
    }

    onSendMessage({
      fromUserId: currentUserId,
      toUserId: otherUserId,
      athleteId: athlete?.id,
      content: newMessage.trim(),
      read: false
    })

    setNewMessage('')
  }

  if (!otherUser) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <ChatCircleDots size={48} className="mx-auto mb-2 opacity-50" />
          <p>Selectează o conversație</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className={`${getAvatarColor(otherUser.id)} text-white font-semibold`}>
              {getInitials(otherUser.firstName, otherUser.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {otherUser.firstName} {otherUser.lastName}
            </CardTitle>
            {athlete && (
              <div className="text-sm text-muted-foreground">
                Despre: {athlete.firstName} {athlete.lastName}
              </div>
            )}
          </div>
          <Badge variant="secondary">{otherUser.role === 'coach' ? 'Antrenor' : 'Părinte'}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {conversationMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <ChatCircleDots size={48} className="mx-auto mb-2 opacity-50" />
              <p>Niciun mesaj încă</p>
              <p className="text-sm">Începe conversația!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversationMessages.map((message) => {
                const isFromMe = message.fromUserId === currentUserId
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isFromMe
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString('ro-RO', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSend} className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrie un mesaj... (Enter pentru trimitere, Shift+Enter pentru linie nouă)"
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
            />
            <Button type="submit" size="icon" className="shrink-0" disabled={!newMessage.trim()}>
              <PaperPlaneRight size={20} weight="fill" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Apasă Enter pentru trimitere • Shift+Enter pentru linie nouă
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
