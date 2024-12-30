'use client'

import { useRef, useState, useEffect } from "react"
import { useFormState } from 'react-dom'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User } from 'lucide-react'
import { chatAction } from "@/app/actions"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatState {
  message: string | null
  error: string | null
  status?: string
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [useSearch, setUseSearch] = useState(false)
  const [state, formAction] = useFormState<ChatState, FormData>(
    chatAction,
    {
      message: null,
      error: null,
      status: ''
    }
  )
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const handleSubmit = async (formData: FormData) => {
    const message = formData.get('message') as string
    if (!message?.trim()) return
    
    setMessages(prev => [...prev, { role: 'user', content: message }])
    
    formData.append('useSearch', useSearch.toString())
    formAction(formData)
    
    // Reset form
    const form = document.querySelector('form') as HTMLFormElement
    form.reset()
    
    // Scroll to bottom
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
      }
    }, 100)
  }

  useEffect(() => {
    if (state?.message && typeof state.message === 'string') {
      setMessages(prev => [...prev, { role: 'assistant', content: state.message as string }])
    }
    if (state?.message) {
      const formData = new FormData()
      formData.append('message', '')
      formAction(formData)
    }
  }, [state?.message])

  return (
    <Card className="w-full">
      <CardHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">AI Chat Assistant</h2>
          <div className="flex items-center space-x-2">
            <Switch
              id="search-mode"
              checked={useSearch}
              onCheckedChange={setUseSearch}
            />
            <Label htmlFor="search-mode">启用搜索</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea ref={scrollAreaRef} className="h-[600px] pr-4">
          <div className="flex flex-col gap-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar>
                    <AvatarFallback>AI</AvatarFallback>
                    <AvatarImage>
                      <Bot className="h-6 w-6" />
                    </AvatarImage>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted prose dark:prose-invert'
                  }`}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.role === 'user' && (
                  <Avatar>
                    <AvatarFallback>ME</AvatarFallback>
                    <AvatarImage>
                      <User className="h-6 w-6" />
                    </AvatarImage>
                  </Avatar>
                )}
              </div>
            ))}
            
            {state.status && (
              <div className="flex gap-3">
                <Avatar>
                  <AvatarFallback>AI</AvatarFallback>
                  <AvatarImage>
                    <Bot className="h-6 w-6" />
                  </AvatarImage>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2 animate-pulse">
                  {state.status}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      {state.error && (
        <div className="px-4 py-2 text-red-500">
          错误: {state.error}
        </div>
      )}
      
      <CardFooter className="border-t p-4">
        <form action={formAction} onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(new FormData(e.currentTarget))
        }} className="flex w-full gap-4">
          <Input
            placeholder="Type your message..."
            name="message"
            className="flex-1"
            disabled={!!state.status}
          />
          <Button type="submit" disabled={!!state.status}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

