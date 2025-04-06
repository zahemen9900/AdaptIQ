import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";
import Logo from "../assets/Logo.png";
import { IconArrowRight, IconEye, IconEyeOff } from "@tabler/icons-react";
import { signInWithEmailAndPassword } from "@firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "@firebase/firestore";
import { useUser } from "../context/UserContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { updateUserData } = useUser();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
    showPassword: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; 
    }  

    setIsLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password); 
      const user = userCredential.user;
      
      if (user) {
        // Get user data directly from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // Found user in Firestore
          const userData = userSnap.data();
          console.log("User data from Firestore:", userData);
          
          // Update the user context with Firebase data
          updateUserData({
            nickname: userData.nickname || 'Student',
            isAuthenticated: true,
            uid: user.uid,
            courses: userData.courses || [],
            loadingUser: false
          });
          
          // We don't need to overwrite localStorage data here
          // as the UserContext is now the source of truth
        } else {
          // No Firestore data, try to use localStorage as fallback
          console.log("No user data found in Firestore, using localStorage");
          const onboardingData = localStorage.getItem('onboardingData');
          
          if (onboardingData) {
            const localData = JSON.parse(onboardingData);
            updateUserData({
              nickname: localData.nickname || 'Student',
              isAuthenticated: true,
              uid: user.uid,
              courses: localData.courses || [],
              loadingUser: false
            });
          } else {
            // No data anywhere, use default values
            updateUserData({
              nickname: 'Student',
              isAuthenticated: true,
              uid: user.uid,
              courses: [],
              loadingUser: false
            });
          }
        }
        
        // Navigate to dashboard after updating user context
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorCode = error.code;
      
      // Handle specific Firebase auth errors with user-friendly messages
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        setErrors({general: 'Invalid email or password'});
      } else if (errorCode === 'auth/too-many-requests') {
        setErrors({general: 'Too many failed login attempts. Please try again later.'});
      } else {
        setErrors({general: 'An error occurred during login'});
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Link to="/" className="logo-link">
            <img src={Logo} alt="AdaptIQ Logo" className="login-logo" />
          </Link>
          <h1>Welcome Back</h1>
          <p>Log in to continue your personalized learning journey</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              className={errors.email ? "error" : ""}
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={formData.showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={errors.password ? "error" : ""}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    showPassword: !prev.showPassword,
                  }))
                }
                disabled={isLoading}
              >
                {formData.showPassword ? (
                  <IconEye size={20} />
                ) : (
                  <IconEyeOff size={20} />
                )}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {errors.general && (
            <div className="general-error">
              <span className="error-message">{errors.general}</span>
            </div>
          )}

          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isLoading}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Log In'} {!isLoading && <IconArrowRight size={18} />}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="signup-link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
