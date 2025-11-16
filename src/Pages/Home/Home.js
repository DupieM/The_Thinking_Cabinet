import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import './Home.css';
import image1 from "../../assets/landing_image.png";
import quate1 from "../../assets/Quoate_1.png";
import quate2 from "../../assets/Quoate_2.png";
import { Link } from 'react-router-dom';
import ScrollToTopButton from "../../componements/ScrollToTopButton";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase";

function Home() {
  // creating const varibles to call functions and data
    const [userId, setUserId] = useState("");
    const [showWelcome, setShowWelcome] = useState(false);
    const [usersCollections, setUsersCollections] = useState([]);
    const [isWunderkammerHovered, setIsWunderkammerHovered] = useState(false);

    // UseEffect to get the current user that is logged in from Authentication
    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
            setUserId(user.uid);
            // Check if the welcome message has been shown for this user
            const welcomeShown = localStorage.getItem(`welcomeShown_${user.uid}`);
            if (!welcomeShown) {
                setShowWelcome(true);
                localStorage.setItem(`welcomeShown_${user.uid}`, "true");
            }
        } else {
            console.log("No user logged in.");
            // If no user, we can reset the flag if needed, or just keep it as not shown
            // localStorage.removeItem('welcomeShown_'); // Uncomment if you want to show it to the next logged-in user
        }
    }, []);

     // Get user collections to display on homepage
    useEffect(() => {
        fetchUsersWithCollections().then(data => setUsersCollections(data));
    }, []);

     // Specify from user collections what we want to get and display on homne page
    const fetchUsersWithCollections = async () => {
        try {
            const usersRef = collection(db, "users");
            const usersSnapshot = await getDocs(usersRef);

            // Let's pick 3 random or first 3 users for demo
            const users = usersSnapshot.docs.slice(0, 3);

            const usersCollections = [];

            for (const userDoc of users) {
                const userId = userDoc.id;
                const userData = userDoc.data();

                // fetch user's collections (maybe just 1 collection per user to keep UI simple)
                const collectionsRef = collection(db, "users", userId, "collections");
                const collectionsSnapshot = await getDocs(collectionsRef);

                if (collectionsSnapshot.size > 0) {
                    const firstCollectionDoc = collectionsSnapshot.docs[0];
                    const collectionId = firstCollectionDoc.id;
                    const collectionData = firstCollectionDoc.data();

                    // fetch images of this collection
                    const imagesRef = collection(db, "users", userId, "collections", collectionId, "images");
                    const imagesSnapshot = await getDocs(imagesRef);
                    const images = imagesSnapshot.docs.map(doc => doc.data().url);

                    usersCollections.push({
                        userId,
                        userName: userData.displayName || 'Unknown User',
                        collectionName: collectionData.collectionName || collectionId,
                        images,
                    });
                }
            }

            return usersCollections;
        } catch (error) {
            console.error("Error fetching users collections:", error);
            return [];
        }
    };

     // Handle the open and close of pop up window of wunderkammer
    const handleWunderkammerHover = () => {
        setIsWunderkammerHovered(true);
    };
    const handleWunderkammerMouseLeave = () => {
        setIsWunderkammerHovered(false);
    };

    return (
        <div className="home-container">
            {showWelcome && (
                <div className="welcome-modal">
                    <div style={{ width: '470px', backgroundColor: '#98A88D', borderRadius: '14px', textAlign: 'center' }}>
                        <div className="modal-content">
                            <h2>Welcome to Wunderkammer!</h2>
                            <p>Enjoy building your own cabinet of curiosities.</p>
                            <button onClick={() => setShowWelcome(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="App2">
                <div className="text">
                    <img src={image1} className="image" alt="Landing Image" />
                    <p className="paragraph">
                        Welcome to The Thinking Cabinet, a unique space for self-reflection, creativity, and discovery.
                        Here, you can create your own <strong
                            onMouseEnter={handleWunderkammerHover}
                            onMouseLeave={handleWunderkammerMouseLeave}
                            style={{ position: 'relative', display: 'inline-block' }}
                        >
                            <a href="https://en.wikipedia.org/wiki/Cabinet_of_curiosities" className="link" target="_blank"> Wunderkammer </a>
                            {isWunderkammerHovered && (
                                <div className="popup">Want to learn what it is?</div>
                            )}
                        </strong> by
                        uploading pictures, with AI generating narratives to
                        bring them to life. Engage in questioning these objects via AI and getting thought-provoking
                        AI-generated answers or crafting your own conversation for deeper reflection.
                    </p>
                    <br />
                    <Link to={`/cabinetAI-pre`} className="button">
                        Get Started
                    </Link>
                </div>
                <br />

                <h2 className="heading">Cabinets by other users</h2>
                <br />

                <div className="collections-grid">
                    {usersCollections.length === 0 ? (
                        <p>Loading collections...</p>
                    ) : (
                        usersCollections.map((userCollection, idx) => (
                            <div key={idx} className="collection-card">
                                <h3>{userCollection.collectionName}</h3>
                                <p><em>by {userCollection.userName}</em></p>
                                <div className="images-row">
                                    {userCollection.images.length > 0 ? (
                                        userCollection.images.map((url, i) => (
                                            <img key={i} src={url} alt={`Collection ${userCollection.collectionName} img ${i + 1}`} className="collection-image" />
                                        ))
                                    ) : (
                                        <p>No images</p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <br />

                <img src={quate1} className="quate" style={{ marginTop: '40px' }} alt="Quote 1" />
                <p className="qoute_text">
                    This is a thought provoking platform that challenges <br />
                    assumptions and perspectives
                </p>

                <img src={quate2} className="quate" alt="Quote 2" />

                <ScrollToTopButton />

                <footer>
                    <div className="footer">
                        <h6 className="footer_text">Copyright © 2025 The Thinking Cabinet. All rights reserved.</h6>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Home;