import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'chat_messages';
const MAX_MESSAGES = 50; // Maksimum saklanacak mesaj sayısı

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  // LocalStorage'dan mesajları yükle
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Mesajları LocalStorage'a kaydet
  const saveMessages = (newMessages: Message[]) => {
    try {
      // Sadece son MAX_MESSAGES kadar mesajı sakla
      const messagesToStore = newMessages.slice(-MAX_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToStore));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  // Mesaj ekle
  const addMessage = (message: Omit<Message, 'timestamp'>) => {
    const newMessage = {
      ...message,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
  };

  // Mesajları temizle
  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    messages,
    addMessage,
    clearMessages,
  };
}; 