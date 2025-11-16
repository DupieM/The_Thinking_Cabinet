import React, { useState } from "react";
import { signUpUser, loginUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import './Authentication.css';
import cabinetImage from '../../assets/Cabinet.png';
import bcrypt from 'bcryptjs'; // ✅ only if you're manually storing passwords (NOT Firebase Auth)

function Authentications() {
  // creating const varibles to call functions and data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [imageOnRight, setImageOnRight] = useState(false);
  const navigate = useNavigate();

  // Makes sure that a valid email is used for Login and Sign Up
  const validateEmail = (email) => {
    return email.includes("@") && email.endsWith(".com");
  };

  // Fuction that allows for user to be created or logged in on authnetication page
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset all errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    let valid = true;

    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (isSignUp && !validateEmail(email)) {
      setEmailError("Email must contain '@' and end with '.com'");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (isSignUp && password.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      valid = false;
    }

    if (!valid) return;

    try {
      if (isSignUp) {
        await signUpUser(name, email, password);
      } else {
        await loginUser(email, password); // raw password for login comparison
      }
      navigate("/home");
    } catch (err) {
      if (!isSignUp) {
        setGeneralError("Incorrect email or password.");
      } else {
        setGeneralError(err.message || "Sign up failed.");
      }
    }
  };

  // The toggle form that allows to switch between Login and Sig Up forms
  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setImageOnRight(!imageOnRight);
    // Clear all inputs and errors
    setName("");
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
  };

  return (
    <div className="authentication-container">
      <div className={`image-container ${isSignUp ? "normal" : "right"}`}>
        <img
          src={cabinetImage}
          alt="Authentication Background"
          className="authentication-image"
        />
        <button className="toggle-button" onClick={toggleForm}>
          {isSignUp ? "Login" : "Sign Up"}
        </button>
      </div>

      <div className={`form-container ${!isSignUp ? "move-left" : ""}`}>
        <h2 className="Heading">{isSignUp ? "Sign Up" : "Login"}</h2>
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label className="labels">Full Name</label> <br />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="labels-two">Email</label> <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailError && <p className="error-message">{emailError}</p>}
          </div>

          <div className="form-group">
            <label className="labels">Password</label> <br />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (isSignUp) {
                  setPasswordError("");
                }
              }}
              required
            />
            {isSignUp && password && (
              <p style={{ color: "red", marginTop: "5px" }}>
                Password needs to be 6 characters long.
              </p>
            )}
          </div>

          {generalError && (
            <p className="error-message general">{generalError}</p>
          )}

          <button type="submit" className="submit-button">
            {isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Authentications;