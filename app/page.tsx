import { Chat } from "@/components/chat"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="w-full max-w-4xl">
        <Chat />
      </div>
    </div>
  )
}

