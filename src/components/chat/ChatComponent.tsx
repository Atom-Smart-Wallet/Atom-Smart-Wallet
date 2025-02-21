'use client';

import { useState, useRef, useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { ethers } from 'ethers';
import { TransactionAgent } from '@/lib/agents/TransactionAgent';
import { TransactionConfirmModal } from '@/app/components/TransactionConfirmModal';

// Mesaj içeriğini Buffer'a dönüştür
const encodeMessage = (content: string): Buffer => {
  return Buffer.from(content, 'utf-8');
};

// Buffer'dan mesaj içeriğini çöz
const decodeMessage = (buffer: Buffer): string => {
  return buffer.toString('utf-8');
};

interface Props {
  signer?: ethers.Signer;
  accountAddress?: string;
  onTransactionComplete?: () => void;
}

export default function ChatComponent({ signer, accountAddress, onTransactionComplete }: Props) {
  const { messages, addMessage, clearMessages } = useMessages();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<TransactionAgent | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<{
    type: 'single' | 'batch' | 'fund';
    recipient?: string;
    recipients?: string[];
    amount?: string;
    amounts?: string[];
  } | null>(null);
  const [transactionResolver, setTransactionResolver] = useState<{
    resolve: (value: boolean) => void;
    reject: (error: any) => void;
  } | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (signer && accountAddress) {
      agentRef.current = new TransactionAgent(
        signer, 
        accountAddress,
        async (tx) => {
          return new Promise((resolve, reject) => {
            setPendingTransaction(tx);
            setTransactionResolver({ resolve, reject });
            setShowConfirm(true);
          });
        }
      );
    }
  }, [signer, accountAddress]);

  const handleConfirmTransaction = async () => {
    if (transactionResolver) {
      setIsTransactionLoading(true);
      try {
        transactionResolver.resolve(true);
      } finally {
        setShowConfirm(false);
        setPendingTransaction(null);
        setTransactionResolver(null);
        setIsTransactionLoading(false);
      }
    }
  };

  const handleCancelTransaction = () => {
    if (transactionResolver) {
      try {
        transactionResolver.resolve(false);
      } finally {
        setShowConfirm(false);
        setPendingTransaction(null);
        setTransactionResolver(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Kullanıcı mesajını ekle
    addMessage({
      role: 'user',
      content: input,
    });

    setInput('');
    setIsLoading(true);

    try {
      if (!agentRef.current) {
        throw new Error('Cüzdan bağlantısı gerekli');
      }

      // Agent'a mesajı işlet
      const response = await agentRef.current.processMessage(input);
      
      // Agent yanıtını ekle
      addMessage({
        role: 'assistant',
        content: response,
      });

      // İşlem başarılıysa callback'i çağır
      if (response.includes('✅')) {
        onTransactionComplete?.();
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu';
      addMessage({
        role: 'assistant',
        content: `❌ ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mesajları zaman damgasına göre sırala
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <>
      <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-gray-100 font-medium">AI Transaction Assistant</h3>
          <button
            onClick={() => {
              clearMessages();
            }}
            className="px-3 py-1 text-sm text-gray-300 hover:text-gray-100 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sohbeti Temizle
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sortedMessages.map((message) => {
            const decodedContent = decodeMessage(encodeMessage(message.content));
            
            return (
              <div
                key={message.timestamp}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-gray-100'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{decodedContent}</p>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="İşlem yapmak için mesaj yazın... (örn: veli'ye 1 eth gönder)"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-gray-100 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Gönder
            </button>
          </div>
        </form>
      </div>

      {pendingTransaction && (
        <TransactionConfirmModal
          isOpen={showConfirm}
          onClose={handleCancelTransaction}
          onConfirm={handleConfirmTransaction}
          recipient={
            pendingTransaction.type === 'batch'
              ? `${pendingTransaction.recipients?.join(' ve ')}`
              : pendingTransaction.type === 'fund'
              ? 'Smart Account'
              : pendingTransaction.recipient || ''
          }
          amount={
            pendingTransaction.type === 'batch'
              ? `${pendingTransaction.amounts?.join(' + ')}`
              : pendingTransaction.amount || ''
          }
          loading={isTransactionLoading}
        />
      )}
    </>
  );
} 