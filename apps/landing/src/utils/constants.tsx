import { Service, WelcomeFeature, Step, Therapist, Testimonial, Faqs } from '../types';
import {
  FaUserMd,
  FaHeart,
  FaBrain,
  FaComments,
  FaCalendarCheck,
  FaSmile,
  FaSearch
} from 'react-icons/fa';

export const services: Service[] = [
  {
    title: 'Online Therapy',
    imageUrl: 'https://ik.imagekit.io/rqi1dzw2h/homepage/home4.jpg?updatedAt=1746018017700',
    description: 'Access professional therapists from the comfort of your home.'
  },
  {
    title: 'Home Visits',
    imageUrl: 'https://ik.imagekit.io/rqi1dzw2h/homepage/home3.png?updatedAt=1746018247563',
    description: 'Request personalized therapy sessions at your location.'
  },
  {
    title: 'Group Therapy',
    imageUrl: 'https://ik.imagekit.io/rqi1dzw2h/homepage/home2.png?updatedAt=1746018227014',
    description: 'Join community sessions for shared healing and growth.'
  }
];



export const welcomeFeatures: WelcomeFeature[] = [
  {
    icon: <FaUserMd size={24} className="text-blue-600" />,
    title: 'Licensed Therapists',
    description: 'Connect with certified professionals ready to help you heal.'
  },
  {
    icon: <FaHeart size={24} className="text-red-500" />,
    title: 'Holistic Care',
    description: 'We focus on emotional, mental, and psychological well-being.'
  },
  {
    icon: <FaBrain size={24} className="text-purple-600" />,
    title: 'Mental Clarity',
    description: 'Break free from stress, anxiety, and overthinking.'
  },
  {
    icon: <FaComments size={24} className="text-green-600" />,
    title: '24/7 Chat Access',
    description: 'Talk to your therapist whenever you need to.'
  },
];



export const steps: Step[] = [
  {
    icon: <FaSearch size={24} className="text-blue-600" />,
    title: 'Find a Therapist',
    desc: 'Browse our list of verified professionals.',
  },
  {
    icon: <FaCalendarCheck size={24} className="text-green-600" />,
    title: 'Book a Session',
    desc: 'Choose a time that works best for you.',
  },
  {
    icon: <FaComments size={24} className="text-purple-600" />,
    title: 'Start Talking',
    desc: 'Begin your journey to better mental health.',
  },
  {
    icon: <FaSmile size={24} className="text-yellow-500" />,
    title: 'Feel Better',
    desc: 'Experience real change with consistent care.',
  },
];



export const therapists: Therapist[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Clinical Psychologist',
    reviews: 120,
    stars: 4.8,
    experience: 10,
    rate: '$80/hr',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: '2',
    name: 'Mr. James Owen',
    specialty: 'Family Therapist',
    reviews: 87,
    stars: 4.5,
    experience: 8,
    rate: '$70/hr',
    image: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: '3',
    name: 'Mrs. Tolu Ahmed',
    specialty: 'Trauma Specialist',
    reviews: 95,
    stars: 4.7,
    experience: 9,
    rate: '$75/hr',
    image: 'https://randomuser.me/api/portraits/women/3.jpg',
  },
  {
    id: '4',
    name: 'Ms. Kate Mendez',
    specialty: 'Child Psychologist',
    reviews: 102,
    stars: 4.9,
    experience: 11,
    rate: '$85/hr',
    image: 'https://randomuser.me/api/portraits/women/4.jpg',
  },
];


export const testimonialData: Testimonial[] = [
  {
    name: 'Jane Doe',
    title: 'Amazing Support!',
    date: 'March 14, 2025',
    feedback: 'I felt heard and supported every step of the way. Highly recommend!',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
    stars: 5,
  },
  {
    name: 'John Smith',
    title: 'Life-Changing Experience',
    date: 'February 25, 2025',
    feedback: 'DTherapist helped me turn my life around. The platform is fantastic.',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    stars: 5,
  },
  {
    name: 'Emily Johnson',
    title: 'Great Therapists',
    date: 'January 5, 2025',
    feedback: 'The therapist I was matched with was extremely professional and kind.',
    image: 'https://randomuser.me/api/portraits/women/3.jpg',
    stars: 4,
  },
  {
    name: 'Michael Brown',
    title: 'Very Helpful',
    date: 'December 18, 2024',
    feedback: 'Had a very good session. The process of booking was seamless.',
    image: 'https://randomuser.me/api/portraits/men/4.jpg',
    stars: 4,
  },
  {
    name: 'Sarah Williams',
    title: 'Wonderful Experience',
    date: 'November 10, 2024',
    feedback: 'Truly a great place for mental healing and support.',
    image: 'https://randomuser.me/api/portraits/women/5.jpg',
    stars: 5,
  },
  {
    name: 'Daniel Anderson',
    title: 'Trusted and Reliable',
    date: 'October 3, 2024',
    feedback: 'Booking and speaking to my therapist felt natural and easy.',
    image: 'https://randomuser.me/api/portraits/men/6.jpg',
    stars: 5,
  },
];

export const faqs: Faqs[] = [
  {
    question: 'How do I book a session?',
    answer:
      'You can book a session by signing up, choosing your preferred therapist, and selecting a suitable time.',
  },
  {
    question: 'Is my information kept private?',
    answer:
      'Yes, all sessions are confidential and your data is securely stored.',
  },
  {
    question: 'Can I choose my therapist?',
    answer:
      'Absolutely! You can browse through our list of qualified professionals and pick the one that suits your needs.',
  },
];


