import { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Create the context
const UserContext = createContext(null);

// Create a provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    nickname: '',
    isAuthenticated: false,
    uid: null,
    courses: [],
    loadingUser: true
  });

  // Load user data when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // User is signed in - fetch user data from Firebase first
        await getUserDataFromFirebase(authUser.uid);
      } else {
        // User is signed out
        setUser({
          nickname: '',
          isAuthenticated: false,
          uid: null,
          courses: [],
          loadingUser: false
        });
      }
    });
    
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Function to get user data from Firebase
  const getUserDataFromFirebase = async (userId) => {
    try {
      console.log("Fetching user data from Firebase for ID:", userId);
      
      // Get user document from Firestore
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // Successfully got user data from Firebase
        const userData = userSnap.data();
        console.log("Firestore user data:", userData);
        
        setUser({
          nickname: userData.nickname || 'Student',
          isAuthenticated: true,
          uid: userId,
          courses: userData.courses || [],
          loadingUser: false
        });
      } else {
        // No data in Firestore, try localStorage as fallback
        console.log("No user data found in Firebase, checking localStorage");
        getUserDataFromLocalStorage(userId);
      }
    } catch (error) {
      console.error("Error fetching user data from Firebase:", error);
      // Fallback to localStorage if Firebase fails
      getUserDataFromLocalStorage(userId);
    }
  };

  // Function to get user data from localStorage (as fallback)
  const getUserDataFromLocalStorage = (userId) => {
    try {
      // Try to load from localStorage
      const onboardingData = localStorage.getItem('onboardingData');
      
      if (onboardingData) {
        const userData = JSON.parse(onboardingData);
        console.log("LocalStorage user data:", userData);
        
        setUser({
          nickname: userData.nickname || 'Student',
          isAuthenticated: true,
          uid: userId,
          courses: userData.courses || [],
          loadingUser: false
        });
      } else {
        // No data found anywhere, set default values
        setUser({
          nickname: 'Student',
          isAuthenticated: true,
          uid: userId,
          courses: [],
          loadingUser: false
        });
      }
    } catch (error) {
      console.error("Error loading user data from localStorage:", error);
      setUser({
        nickname: 'Student',
        isAuthenticated: true,
        uid: userId,
        courses: [],
        loadingUser: false
      });
    }
  };

  // Function to update user data (can be called from any component)
  const updateUserData = (newData) => {
    setUser(prevState => ({
      ...prevState,
      ...newData
    }));
  };

  // Provide the user state and update function to children
  return (
    <UserContext.Provider value={{ user, updateUserData }}>
      {children}
    </UserContext.Provider>
  );
};

// Create a custom hook for using the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;