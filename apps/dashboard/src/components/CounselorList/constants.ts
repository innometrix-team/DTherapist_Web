import { Therapist } from './types';


export const therapists: Therapist[] = [
  {
    id: '1',
    name: 'Dr. Royce Stephenson',
    image: '/api/placeholder/400/400',
    category: 'Child & Adolescent Therapy',
    reviews: 253,
    rating: 5,
    experience: '12 Years Experience',
    cost: 58,
    about: 'Lorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulputLorem ipsum dolor sit amet consectetur. Mauris purus vulpu',
    availableTimes: ['9:00 AM', '10:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'],
    testimonials: [
      {
        id: '1',
        clientName: 'Kizito Don-Pedro',
        clientImage: '/api/placeholder/50/50',
        rating: 5,
        comment: 'Best medical service in state! Lorem ipsum dolor sit amet, consectetur adipi scing elit. Ut elit tellus, luctus nec ullamcorper mattis pulvinar leo.',
        date: '28 June 2024'
      }
    ]
  },
  {
    id: '2',
    name: 'Kizito Don-Pedro',
    image: '/api/placeholder/400/400',
    category: 'Child & Adolescent Therapy',
    reviews: 189,
    rating: 4,
    experience: '12 Years Experience',
    cost: 58,
    about: 'Experienced therapist specializing in child and adolescent therapy with a focus on behavioral interventions and family counseling.',
    availableTimes: ['8:00 AM', '11:00 AM', '1:00 PM', '5:00 PM', '6:00 PM'],
    testimonials: [
      {
        id: '2',
        clientName: 'Sarah Johnson',
        clientImage: '/api/placeholder/50/50',
        rating: 4,
        comment: 'Great experience with professional care and attention to detail.',
        date: '15 July 2024'
      }
    ]
  },
  {
    id: '3',
    name: 'Dr. Maria Garcia',
    image: '/api/placeholder/400/400',
    category: 'Child & Adolescent Therapy',
    reviews: 342,
    rating: 5,
    experience: '12 Years Experience',
    cost: 58,
    about: 'Specialized in trauma therapy and cognitive behavioral therapy for children and adolescents.',
    availableTimes: ['9:30 AM', '11:30 AM', '2:30 PM', '4:30 PM'],
    testimonials: [
      {
        id: '3',
        clientName: 'Michael Brown',
        clientImage: '/api/placeholder/50/50',
        rating: 5,
        comment: 'Excellent therapist who really understands children.',
        date: '20 July 2024'
      }
    ]
  },
  {
    id: '4',
    name: 'Dr. James Wilson',
    image: '/api/placeholder/400/400',
    category: 'Child & Adolescent Therapy',
    reviews: 156,
    rating: 4,
    experience: '12 Years Experience',
    cost: 58,
    about: 'Expert in family therapy and adolescent behavioral issues with a holistic approach.',
    availableTimes: ['10:00 AM', '12:00 PM', '3:00 PM', '5:00 PM'],
    testimonials: [
      {
        id: '4',
        clientName: 'Emily Davis',
        clientImage: '/api/placeholder/50/50',
        rating: 4,
        comment: 'Very professional and caring approach to therapy.',
        date: '25 July 2024'
      }
    ]
  },
  {
    id: '5',
    name: 'Dr. Lisa Chen',
    image: '/api/placeholder/400/400',
    category: 'Child & Adolescent Therapy',
    reviews: 298,
    rating: 5,
    experience: '12 Years Experience',
    cost: 58,
    about: 'Specializes in anxiety and depression treatment for young people using evidence-based approaches.',
    availableTimes: ['8:30 AM', '10:30 AM', '1:30 PM', '3:30 PM'],
    testimonials: [
      {
        id: '5',
        clientName: 'Robert Taylor',
        clientImage: '/api/placeholder/50/50',
        rating: 5,
        comment: 'Outstanding service and genuine care for patients.',
        date: '30 July 2024'
      }
    ]
  }
];