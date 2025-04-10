import './App.css'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Hero from './components/Hero/Hero'
import About from './components/About/About'
import Platform from './components/Platform/Platform'
import Featured from './components/Featured/Featured'
import Technology from './components/Technology/Technology'   
import Statistics from './components/Statistics/Statistics'
import LearningCenters from './components/LearningCenters/LearningCenters'
import Partnerships from './components/Partnerships/Partnerships'
import Newsletter from './components/Newsletter/Newsletter'
import MCMSystem from './components/MCMSystem/MCMSystem'
import ParentAccess from './components/ParentAccess/ParentAccess'
import FAQ from './components/FAQ/FAQ'
import Contact from './components/Contact/Contact'
import Footer from './components/Footer/Footer'
import FAQPage from './pages/FAQPage'
import ContactUs from './pages/contactUs' // Fixed casing to match actual file name
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import CoursesPage from './pages/CoursesPage'
import SchedulePage from './pages/SchedulePage'
import AssignmentsPage from './pages/AssignmentsPage'
import LoadingPage from './pages/LoadingPage'
import CourseLearningPage from './pages/CourseLearningPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import InspirationPage from './pages/InspirationPage'
import ChatPage from './pages/ChatPage'; // Import the new ChatPage
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider } from './context/UserContext'

// Create a HomePage component to contain all the sections
const HomePage = () => {
  return (
    <>
      <Hero />
      <Platform />
      <Featured />
      <Technology />
      <Statistics />
      <LearningCenters />
      <Partnerships />
      <Newsletter />
      <MCMSystem />
      <ParentAccess />
      <FAQ />
      <Contact />
    </>
  );
};

// Create an AboutPage component for the dedicated About page
const AboutPage = () => {
  return (
    <About />
  );
};

const ContactPage = () => {
  return (
    <ContactUs />
  );
};

function App() {
  // Use React Router's useLocation hook to track route changes
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || 
                    location.pathname === '/onboarding' || location.pathname.includes('/dashboard') ||
                    location.pathname.includes('/login') || location.pathname.includes('/signup') ||
                    location.pathname === '/loading';

  return (
    <ThemeProvider>
      <UserProvider>
        {!isAuthPage && <Navbar />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pages" element={<FAQPage />} />
          <Route path="/contactUs" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/chat" element={<ChatPage />} /> {/* Add the route for ChatPage */}
          <Route path="/dashboard/courses" element={<CoursesPage />} />
          <Route path="/dashboard/schedule" element={<SchedulePage />} />
          <Route path="/dashboard/assignments" element={<AssignmentsPage />} />
          <Route path="/dashboard/course/:courseId" element={<CourseLearningPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/inspiration" element={<InspirationPage />} />
        </Routes>
        {!isAuthPage && <Footer />}
      </UserProvider>
    </ThemeProvider>
  )
}

export default App
