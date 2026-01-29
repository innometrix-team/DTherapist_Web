import { Service, WelcomeFeature, Step, Therapist, Testimonial, Faqs, ServiceDetailsMap } from '../types';
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
    title: 'DAnonymous Therapy',
    imageUrl: 'https://ik.imagekit.io/rqi1dzw2h/homepage/anon2.png?updatedAt=1756728634587',
    description: 'Join anonymous community sessions for support and growth.'
  }
];



export const welcomeFeatures: WelcomeFeature[] = [
  {
    icon: <FaUserMd size={24} className="text-primary" />,
    title: 'Grief and Loss Therapy',
    description: 'Supporting individuals coping with bereavement, loss, and trauma.'
  },
  {
    icon: <FaHeart size={24} className="text-primary" />,
    title: 'Child and Adolescent Mental Health Therapy',
    description: 'Empowering young minds to overcome emotional struggles, social challenges, and academic difficulties.'
  },
  {
    icon: <FaBrain size={24} className="text-primary" />,
    title: 'Educational Therapy',
    description: 'Bridging learning gaps, addressing learning difficulties, and promoting academic success.'
  },
  {
    icon: <FaComments size={24} className="text-primary" />,
    title: 'Family, Couple/Marriage Therapy',
    description: 'Strengthening relationships, resolving conflicts, and fostering healthy communication.'
  },
  {
    icon: <FaComments size={24} className="text-primary" />,
    title: 'Synergy Circle',
    description: 'Forging collective growth where everyone looks out for one another.'
  },
  {    icon: <FaSmile size={24} className="text-primary" />,
    title: 'Later-Life Readiness Therapy',
    description: 'Helping individuals age gracefully with emotional support and purposeful living.'
  }
];



export const steps: Step[] = [
  {
    icon: <FaSearch size={24} className="text-primary" />,
    title: 'Find a Therapist',
    desc: 'Browse our list of verified professionals.',
  },
  {
    icon: <FaCalendarCheck size={24} className="text-primary" />,
    title: 'Book a Session',
    desc: 'Choose a time that works best for you.',
  },
  {
    icon: <FaComments size={24} className="text-primary" />,
    title: 'Start Talking',
    desc: 'Begin your journey to better mental health.',
  },
  {
    icon: <FaSmile size={24} className="text-primary" />,
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





// utils/serviceDetails.ts

export const serviceDetails: ServiceDetailsMap = {
  'Grief and Loss Therapy': {
    overview: 'Our grief and loss therapy provides compassionate support for individuals navigating the complex emotions of bereavement and trauma. We understand that everyone grieves differently and at their own pace.',
    whatWeOffer: [
      'Individual grief counseling sessions',
      'Support for various types of loss (death, divorce, job loss, etc.)',
      'Trauma-informed care approaches',
      'Coping strategies and emotional regulation techniques',
      'Memorial and remembrance therapy'
    ],
    whoCanBenefit: [
      'Individuals who have lost a loved one',
      'Those experiencing complicated grief',
      'People dealing with traumatic loss',
      'Individuals struggling with anticipatory grief',
      'Anyone needing support through major life transitions'
    ],
    approaches: [
      'Cognitive Behavioral Therapy (CBT)',
      'Acceptance and Commitment Therapy (ACT)',
      'Narrative therapy',
      'Mindfulness-based interventions',
      'EMDR for traumatic grief'
    ]
  },
  'Child and Adolescent Mental Health Therapy': {
    overview: 'We specialize in supporting young minds through their developmental challenges, providing age-appropriate therapeutic interventions that empower children and teens to overcome emotional struggles.',
    whatWeOffer: [
      'Individual therapy for children (ages 6-12)',
      'Adolescent counseling (ages 13-18)',
      'Behavioral intervention strategies',
      'Social skills development',
      'Academic performance support',
      'Family involvement in treatment'
    ],
    whoCanBenefit: [
      'Children with anxiety or depression',
      'Teens struggling with identity issues',
      'Students with academic difficulties',
      'Young people with behavioral challenges',
      'Children experiencing bullying or peer pressure'
    ],
    approaches: [
      'Play therapy for younger children',
      'Cognitive Behavioral Therapy adapted for youth',
      'Art and music therapy',
      'Solution-focused brief therapy',
      'Dialectical Behavior Therapy skills for teens'
    ]
  },
  'Educational Therapy': {
    overview: 'Our educational therapy bridges the gap between learning challenges and academic success, providing specialized support for students with various learning differences and difficulties.',
    whatWeOffer: [
      'Learning disability assessments',
      'Individualized education planning',
      'Study skills and organization training',
      'Reading and writing support',
      'Math and science tutoring with therapeutic approach',
      'Executive functioning skill development'
    ],
    whoCanBenefit: [
      'Students with dyslexia or other learning disabilities',
      'Children with ADHD affecting academic performance',
      'Students struggling with executive functioning',
      'Learners needing study skills development',
      'Anyone experiencing academic anxiety'
    ],
    approaches: [
      'Multi-sensory learning techniques',
      'Orton-Gillingham method for reading',
      'Cognitive training programs',
      'Assistive technology integration',
      'Metacognitive strategy instruction'
    ]
  },
  'Family, Couple/Marriage Therapy': {
    overview: 'We help families and couples build stronger, healthier relationships through improved communication, conflict resolution, and deeper understanding of each other\'s needs and perspectives.',
    whatWeOffer: [
      'Couples counseling and marriage therapy',
      'Family therapy sessions',
      'Pre-marital counseling',
      'Divorce mediation and co-parenting support',
      'Blended family integration support',
      'Communication skills workshops'
    ],
    whoCanBenefit: [
      'Couples experiencing relationship difficulties',
      'Families dealing with conflict or communication issues',
      'Partners preparing for marriage',
      'Divorced parents needing co-parenting support',
      'Blended families adjusting to new dynamics'
    ],
    approaches: [
      'Emotionally Focused Therapy (EFT)',
      'Gottman Method Couples Therapy',
      'Structural Family Therapy',
      'Solution-Focused Family Therapy',
      'Narrative therapy for families'
    ]
  },
  'Synergy Circle': {
overview: `A Revolutionary Therapy Model that Fosters Supportive Groups and Unlocks Individual Potential

In a world often fixated on individual achievement, it's easy to lose sight of the power of collective support. We strive for personal goals, sometimes forgetting that shared aspirations and mutual encouragement can propel us further than isolated efforts. This is where the concept of what we might call "Synergy Circles" comes into play, a therapeutic approach inspired by Dubbie’s philosophy of "no man left behind."

Forget the traditional image of solitary therapy sessions. Synergy Circles fosters a supportive network within existing relationships—families, friend groups, and sports teams. The core idea is simple: Members commit to holding each other accountable, not through judgment or pressure, but through collaborative support and shared responsibility.`,
    HowItWorks: [
      'No man Left Behind Principle: Synergy Circless cornerstone. It means that the group is committed to supporting every member, regardless of their progress or setbacks. The goal is ensuring everyone feels valued, supported, and empowered to achieve their aspirations.',
      'Shared Goals and Aspirations: The circle begins with a collective discussion about individual and shared goals. This could range from fitness and wellness to career advancement, personal development, shared projects or even team sports',
      'Mutual Support and Encouragement: Members commit to providing consistent support and encouragement. This can involve regular check-ins, celebrating small victories, and offering constructive feedback',
      'Constructive Feedback and Problem-Solving: When someone encounters a setback or struggles to meet their goals, the circle acts as a sounding board. Members offer constructive feedback, brainstorm solutions, and help identify potential roadblocks.',
      'Shared Responsibility: The circle fosters a sense of shared responsibility for each members success. This means actively looking out for each other, offering assistance when needed, and ensuring that no one feels isolated or abandoned',
      'Regular Check-ins: Structured check-ins are crucial. These can be daily, weekly, or monthly, depending on the groups needs. The purpose is to track progress, address challenges, and reaffirm commitments'
    ],
    whoCanBenefit: [
      'Enhanced Motivation: Knowing that others are invested in your success can significantly boost motivation.',
      'Increased Support: The circle provides a reliable source of emotional and practical support. Even in moments of grief and low self-esteem.',
      'Improved Communication: Regular check-ins and open discussions foster better communication and deeper connections.',
      'Greater Sense of Belonging: The circle creates a sense of belonging and community, reducing feelings of isolation.',
      'Accelerated Growth: The combined energy and support of the group can accelerate personal and collective growth.',
      'Reduced feelings of shame: By normalising struggles, and working as a team, individuals feel less shame about not achieving goals immediately'
    ],
    approaches: [
      'Families will intentionally orientate siblings and close relations into a commitment to each other’s welfare and well-being.',
      'Identify Your Circle: Choose individuals who are genuinely interested in your well-being and success',
      'Establish Clear Goals: Define individual and shared goals that are specific, measurable, achievable, relevant, and time-bound (SMART).',
      'Set Ground Rules: Establish clear guidelines for communication, feedback, and support',
      'Celebrate Successes: Acknowledge and celebrate milestones, both big and small',
      'Schedule Regular Check-ins: Determine the frequency and format of check-ins',
      'Be Patient and Supportive: Remember that progress is not always linear. Be patient, supportive, and understanding.',
    ]
  },

  'Later-Life Readiness Therapy': {
    overview: 'We help individuals age gracefully and intentionally by providing accessible, culturally sensitive, and professional counselling tailored to later-life transitions.',
    whatWeOffer: [ 
      'Prepare individuals emotionally for aging before challenges arise from about 50 years',
      'Support mental well-being during physical and lifestyle changes',
      'Reduce loneliness and social isolation',
      'Promote healthy coping with illness, loss, and uncertainty',
      'Encourage purpose, self-worth, and fulfillment beyond youth and productivity',
      'Offer professional support through secure, convenient online sessions'
    ],
    whoCanBenefit: [
      'People aged 50+ who are experiencing stress, anxiety, or depression',
      'Individuals coping with retirement, health issues, or loss of loved ones',
      'Those feeling isolated or lacking purpose in later life',
      'Caregivers seeking support for their own well-being',
      'Africans and Nigerians living abroad seeking culturally informed support',
      'Anyone who wants to age with dignity, confidence, and peace of mind'
    ],
    approaches: [
      'Emotional & Mental Wellness for Aging: Techniques to manage anxiety, depression, and stress related to aging',
      'Loneliness & Social Connection Support: Strategies to build and maintain meaningful relationships',
      'Health-Related Emotional Support: Coping mechanisms for chronic illness, disability, and health changes',
      'Life Transitions & Identity Counseling: Guidance on retirement, loss of roles, and redefining purpose',
      'Grief, Loss & Adjustment Counselling: Support for bereavement and adapting to life changes',
      'Purpose, Meaning & Legacy Work: Helping individuals find fulfillment and leave a lasting impact'
    ],
  },
  };