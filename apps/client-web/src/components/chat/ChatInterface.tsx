'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  MoreVertical,
  Paperclip,
  MapPin,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  ChatMessage, 
  MessageType, 
  MessageStatus, 
  ParticipantRole,
  formatMessageTime,
  getQuickReplies,
  MESSAGE_TEMPLATES
} from '@/lib/chat';
import { useChatConversation } from '@/hooks/useChat';
import { useWaliAuth } from '@/hooks/useWaliAuth';

interface ChatInterfaceProps {
  orderId: string;
  orderNumber: string;
  className?: string;
  compact?: boolean;
}

export function ChatInterface({ 
  orderId, 
  orderNumber, 
  className = '',
  compact = false 
}: ChatInterfaceProps) {
  const { user } = useWaliAuth();
  const {
    currentConversation,
    messages,
    typingUsers,
    isConnected,
    isLoading,
    error,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    loadMoreMessages,
    clearError,
  } = useChatConversation(orderId);

  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marquer les messages comme lus quand ils sont visibles
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessages = messages
        .filter(msg => msg.senderId !== user.id && msg.status !== MessageStatus.READ)
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        setTimeout(() => markAsRead(unreadMessages), 1000);
      }
    }
  }, [messages, user, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      await sendMessage(content);
      setShowQuickReplies(false);
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);
    
    // Gestion de l'indicateur de frappe
    if (value.trim()) {
      startTyping();
      
      // Arrêter après 3 secondes d'inactivité
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } else {
      stopTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickReply = (reply: string) => {
    setMessageInput(reply);
    setShowQuickReplies(false);
    inputRef.current?.focus();
  };

  const getMessageStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.SENDING:
        return <Clock className="h-3 w-3 text-gray-400" />;
      case MessageStatus.SENT:
        return <Check className="h-3 w-3 text-gray-400" />;
      case MessageStatus.DELIVERED:
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case MessageStatus.READ:
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case MessageStatus.FAILED:
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwn = message.senderId === user?.id;
    const isSystem = message.senderRole === ParticipantRole.SYSTEM;

    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center my-4">
          <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full max-w-xs text-center">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          
          {/* Avatar et nom (pour les messages des autres) */}
          {!isOwn && (
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-blue-600">
                  {message.senderName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-600">{message.senderName}</span>
            </div>
          )}

          {/* Bulle de message */}
          <div className={`rounded-lg px-3 py-2 ${
            isOwn 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            
            {/* Contenu du message */}
            <div className="break-words">
              {message.type === MessageType.LOCATION && message.metadata?.location ? (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Position partagée</span>
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
            </div>

            {/* Métadonnées */}
            <div className={`flex items-center justify-between mt-1 ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span className="text-xs">{formatMessageTime(message.timestamp)}</span>
              {isOwn && (
                <div className="ml-2">
                  {getMessageStatusIcon(message.status)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    const otherTypingUsers = typingUsers.filter(t => t.userId !== user?.id);
    
    if (otherTypingUsers.length === 0) return null;

    return (
      <div className="flex justify-start mb-4">
        <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-xs">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {otherTypingUsers[0].userName} tape...
            </span>
          </div>
        </div>
      </div>
    );
  };

  const userRole = user?.role === 'CLIENT' ? ParticipantRole.CLIENT : 
                   user?.role === 'DRIVER' ? ParticipantRole.DRIVER : 
                   ParticipantRole.CLIENT;

  const quickReplies = getQuickReplies(userRole);

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chat non disponible</h3>
          <p className="text-gray-600">
            Connexion au chat en cours...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={compact ? 'p-4' : ''}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Chat - {orderNumber}</span>
            </CardTitle>
            {currentConversation && (
              <CardDescription>
                {currentConversation.participants
                  .filter(p => p.id !== user?.id)
                  .map(p => (
                    <span key={p.id} className="flex items-center space-x-1">
                      <span>{p.name}</span>
                      <Badge variant={p.isOnline ? 'default' : 'secondary'} className="text-xs">
                        {p.isOnline ? 'En ligne' : 'Hors ligne'}
                      </Badge>
                    </span>
                  ))
                }
              </CardDescription>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {currentConversation?.participants
              .filter(p => p.id !== user?.id && p.phone)
              .map(p => (
                <Button key={p.id} variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  Appeler
                </Button>
              ))
            }
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`${compact ? 'p-4 pt-0' : 'pt-0'}`}>
        
        {/* Zone de messages */}
        <div className={`border rounded-lg ${compact ? 'h-64' : 'h-96'} overflow-y-auto p-4 bg-gray-50`}>
          
          {/* Bouton charger plus */}
          {messages.length > 0 && (
            <div className="text-center mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadMoreMessages}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Charger plus de messages
              </Button>
            </div>
          )}

          {/* Messages */}
          {messages.map(renderMessage)}
          
          {/* Indicateur de frappe */}
          {renderTypingIndicator()}
          
          {/* Référence pour auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Erreur */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              ×
            </Button>
          </div>
        )}

        {/* Réponses rapides */}
        {showQuickReplies && quickReplies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply(reply)}
              >
                {reply}
              </Button>
            ))}
          </div>
        )}

        {/* Zone de saisie */}
        <div className="mt-4 flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuickReplies(!showQuickReplies)}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Input
            ref={inputRef}
            placeholder="Tapez votre message..."
            value={messageInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          
          <Button 
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isSending}
            size="sm"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Aide */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          Appuyez sur Entrée pour envoyer • Shift+Entrée pour nouvelle ligne
        </div>
      </CardContent>
    </Card>
  );
}
