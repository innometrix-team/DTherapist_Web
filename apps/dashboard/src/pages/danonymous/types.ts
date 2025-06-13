

export type ChatRole = 'user' | 'contributor'

export interface DAnonymousGroupsProps {
    onGroupSelect: () => void;
}

export interface Group {
    id: string;
    name: string;
    category: string;
    avatar: string;
    banner: string;
}

export interface ChatMessage {
    id: string;
    name: string;
    role: ChatRole;
    content: string;
    timestamp: string;
    isOwn: boolean;
}

export interface MessageGroup {
        date: string;
    messages: ChatMessage[];
}


export const DUMMY_GROUPS: Group[] = [
  {
    id: "1",
    name: "Self-Love Empowerment",
    category: "Education Therapy",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },
  {
    id: "2",
    name: "Mindfulness Warriors",
    category: "Mental Health Support",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },
  {
    id: "3",
    name: "Career Growth Hub",
    category: "Professional Development",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },
  {
    id: "4",
    name: "Fitness Accountability",
    category: "Health & Wellness",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },
  {
    id: "5",
    name: "Book Club Discussion",
    category: "Literature & Learning",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },
  {
    id: "6",
    name: "Creative Writers",
    category: "Writing Community",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },
  {
    id: "7",
    name: "SelfLove Empowerment",
    category: "Education Therapy",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },
  {
    id: "8",
    name: "Mindfulness Warriors",
    category: "Mental Health Support",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },

  {
    id: "9",
    name: "Career Growth Hub",
    category: "Professional Development",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },
  {
    id: "10",
    name: "Fitness Accountability",
    category: "Health & Wellness",
    avatar: "/images/promo-illustration.png",
    banner:
      "https://ik.imagekit.io/rqi1dzw2h/group.jpg?updatedAt=1746015637605",
  },
];

export const DUMMY_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    name: "Anonymous",
    role: "user",
    content:
      "Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor",
    timestamp: new Date().toISOString(),
    isOwn: false,
  },
  {
    id: "2",
    name: "Anonymous",
    role: "user",
    content:
      "Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu",
    timestamp: new Date().toISOString(),
    isOwn: false,
  },
  {
    id: "3",

    name: "Contributor-12",
    role: "contributor",
    content:
      "Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu",
    timestamp: new Date().toISOString(),
    isOwn: true,
  },
  {
    id: "4",
    name: "Anonymous",
    role: "user",
    content:
      "Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor",
    timestamp: new Date().toISOString(),
    isOwn: false,
  },
];