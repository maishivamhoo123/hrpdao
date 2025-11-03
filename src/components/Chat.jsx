import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Send, Paperclip, Smile, Trash2, Edit, User } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { formatDistanceToNow } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import Message from './Message';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Chat() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(location.state?.selectedChatId || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Choosing a localization for date-fns
  const locale = i18n.language === 'uk' ? uk : enUS;

  // Function to create a notification about a new message
  const createMessageNotification = async (message, chatId, recipientId) => {
    try {
      // We get information about the chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('is_group')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;

      // We receive information about the sender
      const { data: senderData, error: senderError } = await supabase
        .from('users')
        .select('username')
        .eq('id', currentUser.id)
        .single();

      if (senderError) throw senderError;

      // Creating the notification text
      let notificationMessage = '';
      if (chatData.is_group) {
        notificationMessage = `${senderData.username}: ${message.content || t('sentAttachment')}`;
      } else {
        notificationMessage = message.content || t('sentAttachment');
      }

      // Creating a notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          sender_id: currentUser.id,
          type: 'message',
          chat_id: chatId,
          message: notificationMessage,
          is_read: false
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    } catch (err) {
      console.error('Error in createMessageNotification:', err);
    }
  };

  // Fetch current user and chats
  useEffect(() => {
    const fetchUserAndChats = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError(t('authError') || 'Помилка автентифікації');
          navigate('/');
          return;
        }
        setCurrentUser(user);

        const { data: memberships, error: membershipError } = await supabase
          .from('chat_members')
          .select('chat_id')
          .eq('user_id', user.id);
        if (membershipError) throw membershipError;

        const chatIds = memberships.map(m => m.chat_id);
        if (chatIds.length === 0) {
          setChats([]);
          setLoading(false);
          return;
        }

        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('id, is_group, created_at')
          .in('id', chatIds);
        if (chatError) throw chatError;

        const processedChats = await Promise.all(
          chatData.map(async (chat) => {
            const { data: members, error: membersError } = await supabase
              .from('chat_members')
              .select('user_id, users (username, profile_picture)')
              .eq('chat_id', chat.id)
              .neq('user_id', user.id);
            if (membersError) throw membersError;

            const otherUser = members.length > 0 ? members[0] : null;
            return {
              id: chat.id,
              is_group: chat.is_group,
              otherUsername: otherUser ? otherUser.users.username : t('groupChat'),
              otherUserProfilePicture: otherUser ? otherUser.users.profile_picture : null,
              otherUserId: otherUser ? otherUser.user_id : null,
              created_at: chat.created_at,
            };
          })
        );

        setChats(processedChats);

        if (selectedChatId && !processedChats.some(chat => chat.id === selectedChatId)) {
          const { data: newChat, error: newChatError } = await supabase
            .from('chats')
            .select('id, is_group, created_at')
            .eq('id', selectedChatId)
            .single();
          if (newChat && !newChatError) {
            const { data: newMembers, error: newMembersError } = await supabase
              .from('chat_members')
              .select('user_id, users (username, profile_picture)')
              .eq('chat_id', newChat.id)
              .neq('user_id', user.id);
            if (newMembersError) throw newMembersError;

            const newChatData = {
              id: newChat.id,
              is_group: newChat.is_group,
              otherUsername: newMembers.length > 0 ? newMembers[0].users.username : t('groupChat'),
              otherUserProfilePicture: newMembers.length > 0 ? newMembers[0].users.profile_picture : null,
              otherUserId: newMembers.length > 0 ? newMembers[0].user_id : null,
              created_at: newChat.created_at,
            };
            setChats(prev => [...prev, newChatData]);
          }
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError(t('errorLoadingChats') || 'Помилка завантаження чатів');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndChats();
  }, [t, navigate, selectedChatId]);

  // Subscribe to new chat memberships
  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel('public:chat_members')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_members',
          filter: `user_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .select('id, is_group, created_at')
            .eq('id', payload.new.chat_id)
            .single();
          if (chatError) {
            console.error('Error fetching new chat:', chatError);
            return;
          }

          const { data: members, error: membersError } = await supabase
            .from('chat_members')
            .select('user_id, users (username, profile_picture)')
            .eq('chat_id', chatData.id)
            .neq('user_id', currentUser.id);
          if (membersError) {
            console.error('Error fetching members:', membersError);
            return;
          }

          const newChat = {
            id: chatData.id,
            is_group: chatData.is_group,
            otherUsername: members.length > 0 ? members[0].users.username : t('groupChat'),
            otherUserProfilePicture: members.length > 0 ? members[0].users.profile_picture : null,
            otherUserId: members.length > 0 ? members[0].user_id : null,
            created_at: chatData.created_at,
          };

          setChats(prev => {
            if (!prev.some(chat => chat.id === newChat.id)) {
              return [...prev, newChat];
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser, t]);

  // Fetch messages for the selected chat
  useEffect(() => {
    if (!selectedChatId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            updated_at,
            user_id,
            file_url,
            users (username, profile_picture)
          `)
          .eq('chat_id', selectedChatId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(t('errorLoadingMessages') || 'Помилка завантаження повідомлень');
        toast.error(t('errorLoadingMessages') || 'Помилка завантаження повідомлень');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`public:messages:chat_id=${selectedChatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChatId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('username, profile_picture')
              .eq('id', payload.new.user_id)
              .single();
            if (userError) {
              console.error('Error fetching user for new message:', userError);
              return;
            }
            
            const newMessage = {
              id: payload.new.id,
              content: payload.new.content,
              created_at: payload.new.created_at,
              updated_at: payload.new.updated_at,
              user_id: payload.new.user_id,
              file_url: payload.new.file_url,
              users: { 
                username: userData.username,
                profile_picture: userData.profile_picture
              },
            };

            setMessages((prev) => {
              // Avoid duplicating messages
              if (prev.some(msg => msg.id === payload.new.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            // Create notifications for other chat participants
            if (payload.new.user_id !== currentUser?.id) {
              try {
                // We get all chat participants except the sender
                const { data: chatMembers, error: membersError } = await supabase
                  .from('chat_members')
                  .select('user_id')
                  .eq('chat_id', selectedChatId)
                  .neq('user_id', payload.new.user_id);

                if (!membersError && chatMembers) {
                  for (const member of chatMembers) {
                    await createMessageNotification(newMessage, selectedChatId, member.user_id);
                  }
                }
              } catch (err) {
                console.error('Error creating notifications for chat members:', err);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id
                  ? {
                      ...msg,
                      content: payload.new.content,
                      updated_at: payload.new.updated_at,
                    }
                  : msg
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedChatId, t, currentUser]);

  // Subscribe to typing status
  useEffect(() => {
    if (!selectedChatId || !currentUser) return;

    const typingChannel = supabase
      .channel(`public:typing:chat_id=${selectedChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_status',
          filter: `chat_id=eq.${selectedChatId}`,
        },
        (payload) => {
          if (payload.new.user_id !== currentUser.id) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [selectedChatId, currentUser]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file selection and preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const fileType = selectedFile.type.split('/')[0];
      if (fileType === 'image' || fileType === 'video') {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(null);
      }
    }
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    setMessageText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Handle typing status
  const handleTyping = async () => {
    if (!selectedChatId || !currentUser) return;

    try {
      await supabase
        .from('typing_status')
        .insert({
          chat_id: selectedChatId,
          user_id: currentUser.id,
          created_at: new Date().toISOString(),
        });
    } catch (err) {
      console.error('Error sending typing status:', err);
    }
  };

  // Handle sending a new message or updating an existing one
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !file && !editingMessageId) return;

    try {
      setError(null);
      let fileUrl = null;

      if (editingMessageId) {
        // Update existing message
        const { error } = await supabase
          .from('messages')
          .update({ content: messageText.trim(), updated_at: new Date().toISOString() })
          .eq('id', editingMessageId)
          .eq('user_id', currentUser.id);
        if (error) throw error;

        // Update local state immediately
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editingMessageId
              ? { ...msg, content: messageText.trim(), updated_at: new Date().toISOString() }
              : msg
          )
        );

        setEditingMessageId(null);
        setMessageText('');
        toast.success(t('messageUpdated') || 'Повідомлення оновлено');
      } else {
        // Upload file to Supabase Storage if present
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`; // Use user_id for folder structure
          const { error: uploadError } = await supabase.storage
            .from('chat_files')
            .upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage
            .from('chat_files')
            .getPublicUrl(fileName);
          fileUrl = publicUrlData.publicUrl;
        }

        const newMessage = {
          chat_id: selectedChatId,
          user_id: currentUser.id,
          content: messageText.trim() || '',
          file_url: fileUrl,
          created_at: new Date().toISOString(),
        };

        // Insert message and retrieve the server-generated ID
        const { data, error } = await supabase
          .from('messages')
          .insert(newMessage)
          .select('id, content, created_at, updated_at, user_id, file_url')
          .single();
        if (error) throw error;

        // Update local state with server data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, profile_picture')
          .eq('id', currentUser.id)
          .single();
        if (userError) throw userError;

        const messageWithUser = {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          updated_at: data.updated_at,
          user_id: data.user_id,
          file_url: data.file_url,
          users: { 
            username: userData.username,
            profile_picture: userData.profile_picture
          },
        };

        setMessages((prev) => [...prev, messageWithUser]);

        // Create notifications for other chat participants
        try {
          // We get all chat participants except the current user
          const { data: chatMembers, error: membersError } = await supabase
            .from('chat_members')
            .select('user_id')
            .eq('chat_id', selectedChatId)
            .neq('user_id', currentUser.id);

          if (!membersError && chatMembers) {
            for (const member of chatMembers) {
              await createMessageNotification(messageWithUser, selectedChatId, member.user_id);
            }
          }
        } catch (err) {
          console.error('Error creating notifications for chat members:', err);
        }

        setMessageText('');
        setFile(null);
        setFilePreview(null);
        fileInputRef.current.value = null; // Reset file input
        toast.success(t('messageSent') || 'Повідомлення надіслано');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(t('errorSendingMessage') || 'Помилка надсилання повідомлення');
      toast.error(t('errorSendingMessage') || 'Помилка надсилання повідомлення');
    }
  };

  // Handle deleting a message
  const handleDeleteMessage = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', currentUser.id);
      if (error) throw error;

      // Update local state immediately
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success(t('messageDeleted') || 'Повідomлення видалено');
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error(t('errorDeletingMessage') || 'Помилка видалення повідомлення');
    }
  };

  // Handle editing a message
  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setMessageText(content);
    setFile(null);
    setFilePreview(null);
    fileInputRef.current.value = null;
  };

  // Handle deleting a chat
  const handleDeleteChat = async (chatId) => {
    try {
      // Delete chat membership for the current user
      const { error: membershipError } = await supabase
        .from('chat_members')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', currentUser.id);
      if (membershipError) throw membershipError;

      // Check if chat has no more members
      const { data: remainingMembers, error: membersError } = await supabase
        .from('chat_members')
        .select('user_id')
        .eq('chat_id', chatId);
      if (membersError) throw membersError;

      if (remainingMembers.length === 0) {
        // Delete all messages in the chat
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .eq('chat_id', chatId);
        if (messagesError) throw messagesError;

        // Delete the chat
        const { error: chatError } = await supabase
          .from('chats')
          .delete()
          .eq('id', chatId);
        if (chatError) throw chatError;
      }

      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
      }
      toast.success(t('chatDeleted') || 'Чат видалено');
    } catch (err) {
      console.error('Error deleting chat:', err);
      toast.error(t('errorDeletingChat') || 'Помилка видалення чату');
    }
  };

  if (loading) return <div className="p-4 text-gray-900">{t('loading')}</div>;
  if (error) return <div className="p-4 text-red-500">{t('error')}: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col">
      <Navbar currentUser={currentUser} />
      
      <div className="w-full mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 mt-4">
        {/* Left Sidebar */}
        <div className="lg:col-span-3">
          <Sidebar currentUser={currentUser} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Chat list */}
            <div className="w-full md:w-1/3 bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('chats')}</h2>
              {chats.length === 0 ? (
                <p className="text-gray-500">{t('noChats')}</p>
              ) : (
                <ul className="space-y-2">
                  <AnimatePresence>
                    {chats.map((chat) => (
                      <motion.li
                        key={chat.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedChatId === chat.id 
                            ? 'bg-blue-100 border border-blue-300' 
                            : 'hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center flex-1">
                          {chat.otherUserProfilePicture ? (
                            <img
                              src={chat.otherUserProfilePicture}
                              alt={chat.otherUsername}
                              className="w-10 h-10 rounded-full mr-3 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                              <User className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                          
                          <div 
                            className="flex-1"
                            onClick={() => setSelectedChatId(chat.id)}
                          >
                            <p className="font-medium text-gray-900">
                              {chat.is_group ? t('groupChat') : chat.otherUsername}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(chat.created_at), { 
                                addSuffix: true, 
                                locale: i18n.language === 'uk' ? uk : enUS 
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteChat(chat.id)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors duration-200"
                          aria-label={t('deleteChat')}
                          title={t('deleteChat')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Messages area */}
            <div className="w-full md:w-2/3 bg-white p-4 rounded-lg shadow-md flex flex-col">
              {selectedChatId ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {(() => {
                        const chat = chats.find((c) => c.id === selectedChatId);
                        return (
                          <>
                            {chat?.otherUserProfilePicture ? (
                              <img
                                src={chat.otherUserProfilePicture}
                                alt={chat.otherUsername}
                                className="w-10 h-10 rounded-full mr-3 object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                <User className="w-6 h-6 text-gray-600" />
                              </div>
                            )}
                            
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">
                                {chat?.otherUsername || t('chat')}
                              </h2>
                              {chat?.otherUserId && !chat.is_group && (
                                <Link
                                  to={`/public/${chat.otherUserId}`}
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {t('viewProfile')}
                                </Link>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto max-h-[60vh] p-2 space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">{t('noMessages')}</p>
                    ) : (
                      <AnimatePresence>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                          >
                            <Message
                              message={message}
                              isOwnMessage={message.user_id === currentUser?.id}
                              onDelete={() => handleDeleteMessage(message.id)}
                              onEdit={() => handleEditMessage(message.id, message.content)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                    {isTyping && (
                      <p className="text-gray-500 text-sm italic">{t('typing')}</p>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="mt-4 flex flex-col gap-2">
                    {filePreview && (
                      <div className="relative inline-block">
                        {file?.type.startsWith('image/') ? (
                          <img src={filePreview} alt="Preview" className="max-w-xs rounded-lg" />
                        ) : file?.type.startsWith('video/') ? (
                          <video src={filePreview} controls className="max-w-xs rounded-lg" />
                        ) : (
                          <p className="text-gray-500 bg-gray-100 p-2 rounded-lg">{file?.name}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setFilePreview(null);
                            fileInputRef.current.value = null;
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full transform translate-x-1/2 -translate-y-1/2"
                          aria-label={t('removeFile')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col">
                        <textarea
                          value={messageText}
                          onChange={(e) => {
                            setMessageText(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (handleSendMessage(e), e.preventDefault())}
                          placeholder={editingMessageId ? t('editMessage') : t('typeMessage')}
                          className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base min-h-[80px] box-border transition-all duration-200"
                          style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}
                        />
                        
                        <div className="flex gap-2 mt-2 justify-between items-center">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current.click()}
                              className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all duration-200"
                              aria-label={t('attachFile')}
                              title={t('attachFile')}
                            >
                              <Paperclip className="h-4 w-4" />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-all duration-200"
                              aria-label={t('selectEmoji')}
                              title={t('selectEmoji')}
                            >
                              <Smile className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <button
                            type="submit"
                            disabled={!messageText.trim() && !file && !editingMessageId}
                            className={`h-10 px-20 rounded-full font-medium text-white transition-all duration-200 flex items-center justify-center gap-1 ${
                              !messageText.trim() && !file && !editingMessageId
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg'
                            }`}
                            aria-label={editingMessageId ? t('updateMessage') : t('sendMessage')}
                            title={editingMessageId ? t('updateMessage') : t('sendMessage')}
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,video/*,.pdf"
                      className="hidden"
                    />
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-16 right-4 z-10">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </div>
                    )}
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500 text-center">{t('selectChat')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Chat;