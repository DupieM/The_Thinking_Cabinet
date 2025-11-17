import React, { useEffect, useState } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { signOut } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import './navbar.css';
import icon from './avatar.png';
import iconActive from './avatar_active.png';
import icon2 from './logout.png';
import logo from './LOGO.png';
import { Link } from "react-router-dom";

function BasicNavbar() {
  // creating const varibles to call functions and data
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Help to determine when current user is logged out
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Handle function to log out a user succesfully
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  // States that both pages of CAbinetAI for navbar show active with "CabinetAI"
  const isCabinetActive =
    location.pathname === "/cabinetAI-pre" || location.pathname === "/cabinetAI-post";

  return (
    <Navbar variant="dark" className="navbar">
      <Container className="navbar-container">
        <div>
          <Navbar.Brand as={Link} to="/home" style={{marginLeft: "-120px"}}>
            <img src={logo} alt="Logo" style={{width: '45%'}} />
          </Navbar.Brand>
        </div>

        <div className="navbar-center">
          <Nav.Link
            as={Link}
            to="/cabinetAI-pre"
            style={{fontSize: '18pt', fontWeight: '700'}}
            className={`nav-link-custom ${isCabinetActive ? 'active' : ''}`}
          >
            CabinetAI
          </Nav.Link>
        </div>

        <div className="navbar-right">
          <Link to="/profile">
            <img
              src={location.pathname === '/profile' ? iconActive : icon}
              className="avatar-icon"
              alt="Profile"
            />
          </Link>

          {user && (
            <button onClick={handleLogout} className="logout-button">
              <img src={icon2} className="logout-icon" alt="Logout" />
            </button>
          )}
        </div>
      </Container>
    </Navbar>
  );
}

export default BasicNavbar;