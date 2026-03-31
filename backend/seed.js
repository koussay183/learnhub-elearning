import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import User from './models/User.js';
import Course from './models/Course.js';
import Session from './models/Session.js';
import Enrollment from './models/Enrollment.js';
import { Test, TestAttempt } from './models/Test.js';
import { CommunityPost } from './models/Community.js';
import ChatMessage from './models/ChatMessage.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear all collections
    await User.deleteMany({});
    await Course.deleteMany({});
    await Session.deleteMany({});
    await Enrollment.deleteMany({});
    await Test.deleteMany({});
    await TestAttempt.deleteMany({});
    await CommunityPost.deleteMany({});
    await ChatMessage.deleteMany({});
    console.log('✓ Cleared existing data');

    // ====== USERS ======
    const passwordHash = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
      {
        email: 'admin@learnhub.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        bio: 'Platform administrator and course curator.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        roles: ['admin', 'instructor', 'student'],
        isVerified: true,
        isActive: true,
        settings: { emailNotifications: true, publicProfile: true },
      },
      {
        email: 'sarah@learnhub.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Johnson',
        bio: 'Full-stack developer with 8 years of experience. Passionate about teaching web development.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        roles: ['instructor', 'student'],
        isVerified: true,
        isActive: true,
        settings: { emailNotifications: true, publicProfile: true },
      },
      {
        email: 'mike@learnhub.com',
        passwordHash,
        firstName: 'Mike',
        lastName: 'Chen',
        bio: 'AI/ML researcher and data science instructor. Love making complex topics simple.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
        roles: ['instructor', 'student'],
        isVerified: true,
        isActive: true,
        settings: { emailNotifications: true, publicProfile: true },
      },
      {
        email: 'emma@learnhub.com',
        passwordHash,
        firstName: 'Emma',
        lastName: 'Wilson',
        bio: 'Computer science student. Learning React and Node.js.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
        roles: ['student'],
        isVerified: true,
        isActive: true,
        settings: { emailNotifications: true, publicProfile: true },
      },
      {
        email: 'alex@learnhub.com',
        passwordHash,
        firstName: 'Alex',
        lastName: 'Rivera',
        bio: 'Aspiring frontend developer. Loves design and UX.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        roles: ['student'],
        isVerified: true,
        isActive: true,
        settings: { emailNotifications: false, publicProfile: true },
      },
      {
        email: 'lisa@learnhub.com',
        passwordHash,
        firstName: 'Lisa',
        lastName: 'Park',
        bio: 'Software engineering student passionate about mobile development.',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
        roles: ['student'],
        isVerified: true,
        isActive: true,
        settings: { emailNotifications: true, publicProfile: false },
      },
    ]);

    console.log(`✓ Created ${users.length} users`);

    const [admin, sarah, mike, emma, alex, lisa] = users;

    // ====== COURSES ======
    const courses = await Course.insertMany([
      {
        title: 'Complete React & Node.js Bootcamp',
        description: 'Master full-stack web development with React, Node.js, Express, and MongoDB. Build real-world projects from scratch. This comprehensive course covers everything from basic React components to advanced patterns like custom hooks, context API, and server-side rendering. On the backend, you will learn Express routing, middleware, authentication with JWT, and database design with MongoDB/Mongoose.',
        category: 'Web Development',
        instructor: sarah._id,
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
        price: 0,
        status: 'published',
        level: 'beginner',
        language: 'English',
        totalSessions: 5,
        totalEnrollments: 3,
        rating: 4.5,
      },
      {
        title: 'Python for Data Science & Machine Learning',
        description: 'Learn Python programming, NumPy, Pandas, Matplotlib, Scikit-Learn, and TensorFlow. Go from zero to building real ML models. This course is perfect for beginners who want to break into the exciting field of data science and artificial intelligence.',
        category: 'Data Science',
        instructor: mike._id,
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop',
        price: 29.99,
        status: 'published',
        level: 'intermediate',
        language: 'English',
        totalSessions: 4,
        totalEnrollments: 2,
        rating: 4.8,
      },
      {
        title: 'UI/UX Design Fundamentals with Figma',
        description: 'Learn user interface and user experience design from scratch using Figma. Create beautiful, functional designs that users love. This project-based course walks you through the entire design process from research to high-fidelity prototypes.',
        category: 'Design',
        instructor: sarah._id,
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
        price: 19.99,
        status: 'published',
        level: 'beginner',
        language: 'English',
        totalSessions: 4,
        totalEnrollments: 1,
        rating: 4.3,
      },
      {
        title: 'Advanced JavaScript: Patterns & Best Practices',
        description: 'Deep dive into advanced JavaScript concepts including closures, prototypes, async patterns, design patterns, and performance optimization. Transform from a junior to a senior JavaScript developer.',
        category: 'Web Development',
        instructor: mike._id,
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop',
        price: 0,
        status: 'published',
        level: 'advanced',
        language: 'English',
        totalSessions: 3,
        totalEnrollments: 2,
        rating: 4.7,
      },
      {
        title: 'Mobile App Development with React Native',
        description: 'Build cross-platform mobile applications using React Native. Deploy to both iOS and Android from a single codebase. Learn navigation, state management, API integration, and app store deployment.',
        category: 'Mobile Development',
        instructor: sarah._id,
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop',
        price: 24.99,
        status: 'published',
        level: 'intermediate',
        language: 'English',
        totalSessions: 4,
        totalEnrollments: 0,
        rating: 0,
      },
      {
        title: 'Cloud Computing with AWS (Draft)',
        description: 'Introduction to Amazon Web Services. Learn EC2, S3, Lambda, and more.',
        category: 'Cloud Computing',
        instructor: mike._id,
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
        price: 39.99,
        status: 'draft',
        level: 'intermediate',
        language: 'English',
        totalSessions: 0,
        totalEnrollments: 0,
        rating: 0,
      },
    ]);

    console.log(`✓ Created ${courses.length} courses`);

    // ====== SESSIONS ======
    const sessionData = [
      // React & Node.js Bootcamp (5 sessions)
      { courseId: courses[0]._id, title: 'Introduction to React', description: 'Learn the fundamentals of React: JSX, components, props, and state.', videoUrl: 'https://www.youtube.com/embed/Ke90Tje7VS0', pdfUrl: 'https://reactjs.org/docs/getting-started.html', order: 1, duration: 45, isPublished: true },
      { courseId: courses[0]._id, title: 'React Hooks Deep Dive', description: 'Master useState, useEffect, useContext, useReducer, and custom hooks.', videoUrl: 'https://www.youtube.com/embed/TNhaISOUy6Q', order: 2, duration: 60, isPublished: true },
      { courseId: courses[0]._id, title: 'Building REST APIs with Express', description: 'Create a full REST API with Express.js, routing, middleware, and error handling.', videoUrl: 'https://www.youtube.com/embed/pKd0Rpw7O48', order: 3, duration: 55, isPublished: true },
      { courseId: courses[0]._id, title: 'MongoDB & Mongoose', description: 'Database design, CRUD operations, schemas, and data modeling with Mongoose.', videoUrl: 'https://www.youtube.com/embed/DZBGEVgL2eE', order: 4, duration: 50, isPublished: true },
      { courseId: courses[0]._id, title: 'Full Stack Project: Build & Deploy', description: 'Connect React frontend to Express backend. Deploy to production.', videoUrl: 'https://www.youtube.com/embed/7CqJlxBYj-M', order: 5, duration: 90, isPublished: true },

      // Python Data Science (4 sessions)
      { courseId: courses[1]._id, title: 'Python Basics & Setup', description: 'Install Python, set up Jupyter Notebooks, and learn fundamental Python syntax.', videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw', order: 1, duration: 40, isPublished: true },
      { courseId: courses[1]._id, title: 'NumPy & Pandas Essentials', description: 'Data manipulation, analysis, and transformation with NumPy arrays and Pandas DataFrames.', videoUrl: 'https://www.youtube.com/embed/vmEHCJofslg', order: 2, duration: 55, isPublished: true },
      { courseId: courses[1]._id, title: 'Data Visualization with Matplotlib', description: 'Create charts, graphs, and visualizations to communicate data insights.', videoUrl: 'https://www.youtube.com/embed/3Xc3CA655Y4', order: 3, duration: 45, isPublished: true },
      { courseId: courses[1]._id, title: 'Introduction to Machine Learning', description: 'Build your first ML models with Scikit-Learn: regression, classification, and clustering.', videoUrl: 'https://www.youtube.com/embed/7eh4d6sabA0', order: 4, duration: 70, isPublished: true },

      // UI/UX Design (4 sessions)
      { courseId: courses[2]._id, title: 'Design Thinking & UX Research', description: 'Learn the design process, user research methods, and persona creation.', videoUrl: 'https://www.youtube.com/embed/gHGN6ld2CZo', order: 1, duration: 35, isPublished: true },
      { courseId: courses[2]._id, title: 'Figma Basics & UI Components', description: 'Master Figma tools, frames, components, and auto-layout.', videoUrl: 'https://www.youtube.com/embed/FTFaQWZBqQ8', order: 2, duration: 50, isPublished: true },
      { courseId: courses[2]._id, title: 'Color Theory & Typography', description: 'Choose effective color palettes and typography for your designs.', videoUrl: 'https://www.youtube.com/embed/AvgCkHrcj90', order: 3, duration: 40, isPublished: true },
      { courseId: courses[2]._id, title: 'Prototyping & Handoff', description: 'Create interactive prototypes and prepare design specs for developers.', videoUrl: 'https://www.youtube.com/embed/dXQ7IHkTiMM', order: 4, duration: 45, isPublished: true },

      // Advanced JavaScript (3 sessions)
      { courseId: courses[3]._id, title: 'Closures, Scopes & the Event Loop', description: 'Understand how JavaScript really works under the hood.', videoUrl: 'https://www.youtube.com/embed/8aGhZQkoFbQ', order: 1, duration: 60, isPublished: true },
      { courseId: courses[3]._id, title: 'Design Patterns in JavaScript', description: 'Module, Observer, Factory, Singleton, and other essential patterns.', videoUrl: 'https://www.youtube.com/embed/kuirGzhGhR8', order: 2, duration: 55, isPublished: true },
      { courseId: courses[3]._id, title: 'Async JavaScript Mastery', description: 'Promises, async/await, generators, and handling complex async flows.', videoUrl: 'https://www.youtube.com/embed/vn3tm0quoqE', order: 3, duration: 50, isPublished: true },

      // React Native (4 sessions)
      { courseId: courses[4]._id, title: 'React Native Setup & Core Components', description: 'Set up your development environment and learn core React Native components.', videoUrl: 'https://www.youtube.com/embed/0-S5a0eXPoc', order: 1, duration: 45, isPublished: true },
      { courseId: courses[4]._id, title: 'Navigation & Routing', description: 'Implement stack, tab, and drawer navigation in your mobile app.', videoUrl: 'https://www.youtube.com/embed/npe3Wf4tpSg', order: 2, duration: 50, isPublished: true },
      { courseId: courses[4]._id, title: 'State Management & API Integration', description: 'Manage app state and connect to REST APIs for dynamic content.', videoUrl: 'https://www.youtube.com/embed/AnjyzruqKn0', order: 3, duration: 55, isPublished: true },
      { courseId: courses[4]._id, title: 'Publishing to App Stores', description: 'Build, test, and deploy your app to the App Store and Google Play.', videoUrl: 'https://www.youtube.com/embed/oBmRcJqJXbk', order: 4, duration: 40, isPublished: true },
    ];

    const sessions = await Session.insertMany(sessionData);
    console.log(`✓ Created ${sessions.length} sessions`);

    // ====== ENROLLMENTS ======
    const reactSessions = sessions.filter(s => s.courseId.equals(courses[0]._id));
    const pythonSessions = sessions.filter(s => s.courseId.equals(courses[1]._id));
    const designSessions = sessions.filter(s => s.courseId.equals(courses[2]._id));
    const jsSessions = sessions.filter(s => s.courseId.equals(courses[3]._id));

    const enrollments = await Enrollment.insertMany([
      { userId: emma._id, courseId: courses[0]._id, progress: 60, completedSessions: [reactSessions[0]._id, reactSessions[1]._id, reactSessions[2]._id], status: 'active' },
      { userId: alex._id, courseId: courses[0]._id, progress: 40, completedSessions: [reactSessions[0]._id, reactSessions[1]._id], status: 'active' },
      { userId: lisa._id, courseId: courses[0]._id, progress: 100, completedSessions: reactSessions.map(s => s._id), status: 'completed', certificateEarned: true, certificateEarnedAt: new Date() },
      { userId: emma._id, courseId: courses[1]._id, progress: 25, completedSessions: [pythonSessions[0]._id], status: 'active' },
      { userId: alex._id, courseId: courses[1]._id, progress: 50, completedSessions: [pythonSessions[0]._id, pythonSessions[1]._id], status: 'active' },
      { userId: lisa._id, courseId: courses[2]._id, progress: 75, completedSessions: [designSessions[0]._id, designSessions[1]._id, designSessions[2]._id], status: 'active' },
      { userId: emma._id, courseId: courses[3]._id, progress: 33, completedSessions: [jsSessions[0]._id], status: 'active' },
      { userId: alex._id, courseId: courses[3]._id, progress: 66, completedSessions: [jsSessions[0]._id, jsSessions[1]._id], status: 'active' },
    ]);

    console.log(`✓ Created ${enrollments.length} enrollments`);

    // ====== TESTS ======
    const tests = await Test.insertMany([
      {
        title: 'JavaScript Fundamentals Quiz',
        description: 'Test your knowledge of core JavaScript concepts including variables, functions, and async programming.',
        courseId: courses[0]._id,
        createdBy: sarah._id,
        questions: [
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'What is the output of typeof null?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctAnswer: '"object"', points: 2 },
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'Which method converts JSON string to a JavaScript object?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.toObject()'], correctAnswer: 'JSON.parse()', points: 2 },
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'What does the "===" operator check?', options: ['Value only', 'Type only', 'Value and type', 'Reference'], correctAnswer: 'Value and type', points: 2 },
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'Which is NOT a JavaScript data type?', options: ['Boolean', 'Float', 'Symbol', 'BigInt'], correctAnswer: 'Float', points: 2 },
          { _id: new mongoose.Types.ObjectId(), type: 'short-answer', question: 'What keyword is used to declare a constant variable in JavaScript?', correctAnswer: 'const', points: 1 },
        ],
        settings: { duration: 10, passingScore: 60, shuffleQuestions: false, showResults: true, openToPublic: true },
        totalAttempts: 2,
        status: 'published',
      },
      {
        title: 'Python Data Types Challenge',
        description: 'Quiz on Python data types, list comprehensions, and basic algorithms.',
        courseId: courses[1]._id,
        createdBy: mike._id,
        questions: [
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'Which of the following is mutable in Python?', options: ['tuple', 'string', 'list', 'frozenset'], correctAnswer: 'list', points: 2 },
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'What does len([1, 2, [3, 4]]) return?', options: ['2', '3', '4', 'Error'], correctAnswer: '3', points: 2 },
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'Which library is used for numerical computing in Python?', options: ['Pandas', 'NumPy', 'Matplotlib', 'Scikit-Learn'], correctAnswer: 'NumPy', points: 2 },
          { _id: new mongoose.Types.ObjectId(), type: 'short-answer', question: 'What function prints output to the console in Python?', correctAnswer: 'print', points: 1 },
        ],
        settings: { duration: 8, passingScore: 50, shuffleQuestions: true, showResults: true, openToPublic: true },
        totalAttempts: 1,
        status: 'published',
      },
      {
        title: 'React Hooks Assessment',
        description: 'Test your understanding of React Hooks: useState, useEffect, useContext, and custom hooks.',
        createdBy: sarah._id,
        questions: [
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'Which hook is used for side effects in React?', options: ['useState', 'useEffect', 'useContext', 'useReducer'], correctAnswer: 'useEffect', points: 2 },
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'What does useState return?', options: ['A value', 'A function', 'An array with value and setter', 'An object'], correctAnswer: 'An array with value and setter', points: 2 },
          { _id: new mongoose.Types.ObjectId(), type: 'multiple-choice', question: 'When does useEffect run by default?', options: ['Only on mount', 'On every render', 'Only on unmount', 'Never'], correctAnswer: 'On every render', points: 2 },
        ],
        settings: { duration: 5, passingScore: 70, shuffleQuestions: false, showResults: true, openToPublic: true },
        totalAttempts: 0,
        status: 'published',
      },
    ]);

    console.log(`✓ Created ${tests.length} tests`);

    // ====== COMMUNITY POSTS ======
    const posts = await CommunityPost.insertMany([
      {
        authorId: sarah._id,
        title: 'Welcome to LearnHub Community!',
        content: 'Hey everyone! Welcome to our learning community. This is the place to share your progress, ask questions, and connect with fellow learners. Feel free to introduce yourself and let us know what you are learning! Remember, the best way to learn is to teach others. So don\'t hesitate to share your knowledge.',
        category: 'announcement',
        likes: [emma._id, alex._id, lisa._id, mike._id],
        views: 42,
        isPinned: true,
        comments: [
          { postId: null, authorId: emma._id, content: 'Thanks Sarah! Excited to be here. Currently learning React and loving it!', likes: [sarah._id, alex._id] },
          { postId: null, authorId: alex._id, content: 'Great community! Looking forward to connecting with everyone.', likes: [sarah._id] },
        ],
      },
      {
        authorId: emma._id,
        title: 'How do you structure large React projects?',
        content: 'I\'m working on a larger React project and I\'m not sure how to organize my files. Should I use feature-based folders or type-based folders (components/, hooks/, utils/)? What has worked best for you in production apps? Any tips on code splitting and lazy loading for performance?',
        category: 'question',
        likes: [sarah._id, mike._id, alex._id],
        views: 28,
        isPinned: false,
        comments: [
          { postId: null, authorId: sarah._id, content: 'I recommend feature-based folders for larger projects. Group by feature (auth/, courses/, chat/) and keep components, hooks, and utils together. It scales much better!', likes: [emma._id, mike._id] },
          { postId: null, authorId: mike._id, content: 'Agreed with Sarah. Also check out the "screaming architecture" pattern. Your folder structure should scream what the app does, not what framework you use.', likes: [emma._id] },
        ],
      },
      {
        authorId: mike._id,
        title: 'Free resources for learning Data Science',
        content: 'Here are some amazing free resources I\'ve collected over the years:\n\n1. **Kaggle** - Free datasets and competitions\n2. **Google Colab** - Free Jupyter notebooks with GPU\n3. **fast.ai** - Practical deep learning courses\n4. **Papers With Code** - Latest ML research with implementations\n5. **StatQuest** - YouTube channel for statistics\n\nWhat resources have helped you the most?',
        category: 'resource',
        likes: [emma._id, alex._id, lisa._id, sarah._id, admin._id],
        views: 65,
        isPinned: false,
        comments: [
          { postId: null, authorId: lisa._id, content: 'StatQuest is amazing! Josh Starmer explains everything so clearly. Also adding: 3Blue1Brown for linear algebra visualizations.', likes: [mike._id, emma._id] },
          { postId: null, authorId: alex._id, content: 'Kaggle competitions are a game changer. Nothing beats learning by doing!', likes: [mike._id] },
        ],
      },
      {
        authorId: alex._id,
        title: 'Just finished my first full-stack project!',
        content: 'After 3 months of learning, I finally deployed my first MERN stack application! It\'s a simple task manager but I\'m so proud of it. It has authentication, CRUD operations, and even real-time updates with Socket.io. The journey was tough but totally worth it. Never give up on your learning goals!',
        category: 'discussion',
        likes: [sarah._id, mike._id, emma._id, lisa._id],
        views: 34,
        isPinned: false,
        comments: [
          { postId: null, authorId: sarah._id, content: 'Congratulations Alex! That\'s a huge milestone. Would love to see a demo!', likes: [alex._id] },
          { postId: null, authorId: emma._id, content: 'This is so inspiring! I\'m still working on mine. Keep it up!', likes: [alex._id] },
        ],
      },
      {
        authorId: lisa._id,
        title: 'Tips for learning to code more effectively',
        content: 'Things that helped me learn faster:\n\n- **Code every day**, even if just 30 minutes\n- **Build projects**, not just follow tutorials\n- **Read other people\'s code** on GitHub\n- **Teach what you learn** (write blog posts or explain to friends)\n- **Take breaks** - your brain processes information while resting\n\nWhat are your top learning tips?',
        category: 'discussion',
        likes: [sarah._id, mike._id, emma._id],
        views: 21,
        isPinned: false,
      },
    ]);

    console.log(`✓ Created ${posts.length} community posts`);

    // ====== CHAT MESSAGES ======
    const chatMessages = await ChatMessage.insertMany([
      { senderId: emma._id, roomId: 'general', content: 'Hey everyone! Anyone working on the React bootcamp?' },
      { senderId: alex._id, roomId: 'general', content: 'Yeah! I just finished the hooks section. It was great!' },
      { senderId: sarah._id, roomId: 'general', content: 'Glad to hear that Alex! Let me know if you have any questions about the next section.' },
      { senderId: lisa._id, roomId: 'general', content: 'I\'m starting the Python course today. Wish me luck! 🍀' },
      { senderId: mike._id, roomId: 'general', content: 'Good luck Lisa! The first two sessions are very beginner-friendly.' },
      { senderId: emma._id, roomId: 'general', content: 'Does anyone want to form a study group for the JavaScript patterns course?' },
      { senderId: alex._id, roomId: 'general', content: 'I\'m in! That course looks really interesting.' },
      { senderId: sarah._id, roomId: 'general', content: 'Great idea Emma! Study groups are the best way to learn. I can drop by to answer questions sometimes.' },
    ]);

    console.log(`✓ Created ${chatMessages.length} chat messages`);

    // ====== SUMMARY ======
    console.log('\n========================================');
    console.log('  SEED DATA COMPLETE');
    console.log('========================================');
    console.log(`  Users:       ${users.length}`);
    console.log(`  Courses:     ${courses.length}`);
    console.log(`  Sessions:    ${sessions.length}`);
    console.log(`  Enrollments: ${enrollments.length}`);
    console.log(`  Tests:       ${tests.length}`);
    console.log(`  Posts:       ${posts.length}`);
    console.log(`  Messages:    ${chatMessages.length}`);
    console.log('========================================');
    console.log('\n  LOGIN CREDENTIALS (all users):');
    console.log('  Password: password123');
    console.log('');
    console.log('  admin@learnhub.com   (admin + instructor)');
    console.log('  sarah@learnhub.com   (instructor)');
    console.log('  mike@learnhub.com    (instructor)');
    console.log('  emma@learnhub.com    (student)');
    console.log('  alex@learnhub.com    (student)');
    console.log('  lisa@learnhub.com    (student)');
    console.log('========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
