import ChatComponent from '@/components/chat/ChatComponent';

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          AI Chat Assistant
        </h1>
        <ChatComponent />
      </div>
    </main>
  );
} 