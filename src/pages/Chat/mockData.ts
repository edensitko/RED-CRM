import { faker } from '@faker-js/faker';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'הודעה' | 'משימה' | 'עדכון';
  read: boolean;
  relatedTaskId?: string;
  relatedDealId?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: number;
}

const messageTypes = ['הודעה', 'משימה', 'עדכון'] as const;

export const generateMessages = (count: number, userIds: string[]): Message[] => {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    senderId: faker.helpers.arrayElement(userIds),
    senderName: faker.person.fullName(),
    content: faker.lorem.sentences(2),
    timestamp: faker.date.recent({ days: 7 }).getTime(),
    type: faker.helpers.arrayElement(messageTypes),
    read: faker.datatype.boolean(),
    relatedTaskId: faker.datatype.boolean() ? faker.string.uuid() : undefined,
    relatedDealId: faker.datatype.boolean() ? faker.string.uuid() : undefined,
  }));
};

export const generateChatRooms = (count: number, userIds: string[]): ChatRoom[] => {
  return Array.from({ length: count }, () => {
    const participants = faker.helpers.arrayElements(
      userIds,
      faker.number.int({ min: 2, max: Math.min(5, userIds.length) })
    );
    
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      participants,
      lastMessage: faker.lorem.sentence(),
      lastMessageTime: faker.date.recent({ days: 1 }).getTime(),
    };
  });
};
