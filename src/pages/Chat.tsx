import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'הודעה' | 'קובץ' | 'תמונה';
  read: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  participants: string[];
  type: 'private' | 'group';
}

const mockChatRooms: ChatRoom[] = [
  {
    id: '1',
    name: 'צוות מכירות',
    lastMessage: 'יש לנו פגישת צוות בשעה 14:00',
    lastMessageTime: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    unreadCount: 3,
    participants: ['user1', 'user2', 'user3'],
    type: 'group',
  },
  {
    id: '2',
    name: 'תמיכה טכנית',
    lastMessage: 'הבעיה נפתרה בהצלחה',
    lastMessageTime: Date.now() - 1000 * 60 * 45, // 45 minutes ago
    unreadCount: 0,
    participants: ['user1', 'user4'],
    type: 'group',
  },
  {
    id: '3',
    name: 'ישראל ישראלי',
    lastMessage: 'תודה רבה על העזרה',
    lastMessageTime: Date.now() - 1000 * 60 * 120, // 2 hours ago
    unreadCount: 1,
    participants: ['user1', 'user5'],
    type: 'private',
  },
];

const mockMessages: { [key: string]: Message[] } = {
  '1': [
    {
      id: '1',
      senderId: 'user2',
      senderName: 'דוד כהן',
      content: 'בוקר טוב לכולם!',
      timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
      type: 'הודעה',
      read: true,
    },
    {
      id: '2',
      senderId: 'user3',
      senderName: 'שרה לוי',
      content: 'יש לנו פגישת צוות בשעה 14:00',
      timestamp: Date.now() - 1000 * 60 * 15,
      type: 'הודעה',
      read: false,
    },
  ],
  '2': [
    {
      id: '3',
      senderId: 'user4',
      senderName: 'רון אברהם',
      content: 'יש לנו תקלה במערכת',
      timestamp: Date.now() - 1000 * 60 * 90,
      type: 'הודעה',
      read: true,
    },
    {
      id: '4',
      senderId: 'user1',
      senderName: 'יעקב ישראלי',
      content: 'הבעיה נפתרה בהצלחה',
      timestamp: Date.now() - 1000 * 60 * 45,
      type: 'הודעה',
      read: true,
    },
  ],
};

const Chat: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatRooms(mockChatRooms);
    setMessages(mockMessages['1']);
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      const roomMessages = mockMessages[selectedRoom];
      setMessages(roomMessages.sort((a, b) => a.timestamp - b.timestamp));
      scrollToBottom();
    }
  }, [selectedRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedRoom && currentUser) {
      const messageData: Message = {
        id: Math.random().toString(36).substring(7),
        senderId: currentUser.uid,
        senderName: currentUser.displayName ?? currentUser.email ?? 'Anonymous User',
        content: newMessage.trim(),
        timestamp: Date.now(),
        type: 'הודעה', // Default type as a regular message
        read: false,   // New messages start as unread
      };

      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage('');
    }
  };

  const createNewRoom = async () => {
    if (newRoomName && selectedUsers.length > 0 && currentUser) {
      const roomData: ChatRoom = {
        id: Math.random().toString(36).substring(7),
        name: newRoomName,
        participants: [...selectedUsers, currentUser.uid],
        lastMessage: '', // Initial empty message
        lastMessageTime: Date.now(),
        unreadCount: 0,  // Initial unread count
        type: selectedUsers.length > 1 ? 'group' : 'private'  // Set type based on number of participants
      };

      setChatRooms((prevRooms) => [...prevRooms, roomData]);
      setIsCreatingRoom(false);
      setNewRoomName('');
      setSelectedUsers([]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden bg-white rounded-lg shadow-sm">
      {/* Sidebar */}
      <div className="w-64 border-l bg-gray-50">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <button
              onClick={() => setIsCreatingRoom(true)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              צ'אט חדש
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedRoom === room.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{room.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">
                {chatRooms.find((room) => room.id === selectedRoom)?.name}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === currentUser?.uid
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === currentUser?.uid
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-sm font-medium">
                        {message.senderName}
                      </div>
                      <div>{message.content}</div>
                      <div className="text-xs mt-1 opacity-75">
                        {new Date(message.timestamp).toLocaleTimeString('he-IL')}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="הקלד הודעה..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  שלח
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            בחר צ'אט או צור חדש כדי להתחיל
          </div>
        )}
      </div>

      {/* New chat room modal */}
      {isCreatingRoom && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsCreatingRoom(false)}
            ></div>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    שם הצ'אט
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    משתתפים
                  </label>
                  <div className="mt-1 space-y-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(
                                selectedUsers.filter((id) => id !== user.id)
                              );
                            }
                          }}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="mr-2 text-sm text-gray-900">
                          {user.displayName || user.email}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={createNewRoom}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                >
                  צור צ'אט
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingRoom(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
