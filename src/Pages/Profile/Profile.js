import React, { useState, useRef, useEffect } from 'react';
import "./Profile.css";
import { auth, storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import ScrollToTopButton from '../../componements/ScrollToTopButton';
import { getStoryText } from '../../services/DbService';
import { useLocation, useNavigate } from "react-router-dom";
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

function Profile() {
  // creating const varibles to call functions and data
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);
  const [user, setUser] = useState('');
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState({ displayName: '', email: '', password: '' });
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [collectionsData, setCollectionsData] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState('');
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const location = useLocation();
  const { storyName, genre, images, narrative, chatMessages } = location.state || {};
  const navigate = useNavigate();

  // Const variable to set the new password
  const handleNewPasswordChange = (event) => {
    setNewPassword(event.target.value);
  };

  // handles all the edit functions for the new password
  const handleEditPasswordClick = () => {
    setIsEditingPassword(true);
    setPasswordUpdateError('');
    setPasswordUpdateSuccess('');
  };

  // Function to make and save new password of the user
  const handleSavePasswordClick = async () => {
    setPasswordUpdateError('');
    setPasswordUpdateSuccess('');

    if (!user) {
      setPasswordUpdateError('No user logged in.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordUpdateError('Password must be at least 6 characters long.');
      return;
    }

      try {
        // Step 1: Reauthenticate
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Step 2: Update password
        await updatePassword(user, newPassword);

        // (Optional) Update Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          password: newPassword,
        });

        setPasswordUpdateSuccess('Password updated successfully!');
        setIsEditingPassword(false);
        setNewPassword('');
        setCurrentPassword('');

      } catch (error) {
        console.error('Error updating password:', error);
        if (error.code === 'auth/wrong-password') {
          setPasswordUpdateError('Incorrect current password.');
        } else if (error.code === 'auth/too-many-requests') {
          setPasswordUpdateError('Too many failed attempts. Try again later.');
        } else {
          setPasswordUpdateError(error.message);
          }
      }
    };

    // Handles when the password is changed
    const handleCancelPasswordEdit = () => {
      setIsEditingPassword(false);
      setNewPassword('');
      setPasswordUpdateError('');
      setPasswordUpdateSuccess('');
    };

    // Load user data
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
        if (authUser) {
          setUser(authUser);
          const userDocRef = doc(db, 'users', authUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData({
              displayName: data.displayName || authUser.displayName || 'No name set',
              email: authUser.email,
              password: data.password || '',
            });
            setProfileImageUrl(data.profileImageUrl || '');
          } else {
            setUserData({
              displayName: authUser.displayName || 'No name set',
              email: authUser.email,
              password: '',
            });
          }
          } else {
              setUser(null);
              setUserData({ displayName: '', email: '', password: '' });
              setProfileImageUrl('');
            }
        });

        return () => unsubscribe();
    }, []);

    // Load user collections with images and story
    useEffect(() => {
        const fetchUserCollectionsData = async () => {
            if (!user) {
                setCollectionsData([]); // Ensure collectionsData is empty if no user
                console.log('No user logged in, skipping collection fetch.');
                return;
            }
            console.log('Fetching collections for user:', user.uid);

            // To get all the collections from Firebase for current user
            try {
                const collectionsRef = collection(db, 'users', user.uid, 'collections');
                const snapshot = await getDocs(collectionsRef);
                console.log('Collections snapshot:', snapshot);
                const allCollectionsData = [];

                console.log('...')
                console.log(snapshot.size)
                snapshot.forEach((doc) => {
                    console.log(doc.id, " => ", doc.data());
                });

                console.log('...')

                for (const collectionDoc of snapshot.docs) {
                    const collectionId = collectionDoc.id;
                    const collectionName = collectionDoc.data().collectionName || collectionId;
                    console.log('Processing collection:', collectionId, 'Name:', collectionName);

                    // Extract image data
                    const imagesRef = collection(db, 'users', user.uid, 'collections', collectionId, 'images');
                    const imagesSnapshot = await getDocs(imagesRef);
                    const collectionImages = imagesSnapshot.docs
                        .filter(doc => doc.id !== 'story')
                        .map(doc => ({
                            id: doc.id,
                            imageUrl: doc.data().url,
                        }));
                    console.log('Images for collection', collectionId, ':', collectionImages);

                    // Extract story data, accessing the title and narrative
                    const storyRef = collection(db, 'users', user.uid, 'collections', collectionId, 'stories');
                    const storySnapshot = await getDocs(storyRef);

                    const collectionStories = storySnapshot.docs
                        .map(doc => ({
                            id: doc.id,
                            title: doc.data()?.story?.title || 'Untitled Story', // Access nested title
                            narrative: doc.data()?.story?.narrative || 'No story available', // Access nested narrative
                        }));

                    console.log('Stories for collection', collectionId, ':', collectionStories);


                    allCollectionsData.push({
                        id: collectionId,
                        name: collectionName,
                        images: collectionImages,
                        story: collectionStories,
                    });
                }
                setCollectionsData(allCollectionsData);
                console.log('Fetched collections data:', allCollectionsData);
            } catch (error) {
                console.error('Error fetching collections data:', error);
                setCollectionsData([]); // Handle potential errors by setting to empty
            }
        };

        fetchUserCollectionsData();
    }, [user]);

    // Handle the change of imnage fromn file input
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    // Handle click function to open file explorer
    const handleClick = () => {
        fileInputRef.current.click();
    };

    // Function the upload of image and displaying it on the screen
    const handleUpload = async () => {
        if (!image || !user) {
            console.error("No image selected or user not logged in.");
            return;
        }

        setUploading(true);
        const imageRef = ref(storage, `users/${user.uid}/profileImage`);

        try {
            const snapshot = await uploadBytes(imageRef, image);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                profileImageUrl: downloadURL,
            });

            setProfileImageUrl(downloadURL);
            setImage(null);
            alert("Profile image updated successfully!");
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload profile image.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="App2">

            <button className="story_button" onClick={() => navigate(-1)}>← Back to Story</button>

            <h2 className='Heading_one'>Update Profile</h2>

            {/* Profile Picture Section */}
            <div className='profile_container'>
                <div className="profile-picture-container">
                    <div
                        className="profile-picture"
                        style={{
                            backgroundImage: `url(${image ? URL.createObjectURL(image) : (profileImageUrl || 'placeholder-image.png')})`,
                        }}
                    />
                    <button className="upload-button" onClick={handleClick} disabled={uploading}>
                        {uploading ? 'Uploading...' : (image ? 'Change Image' : 'Upload')}
                    </button>
                    {image && (
                        <button className="save-button" onClick={handleUpload} disabled={uploading}>
                            {uploading ? 'Saving...' : 'Save Image'}
                        </button>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                    />
                </div>

                <div className="information">
                    <p>
                        <strong>Name:</strong> <br/>
                        {userData.displayName}
                    </p>
                    <p>
                        <strong>Email:</strong> <br/>
                        {userData.email}
                    </p>
                    <p>
                        <strong>Password:</strong> <br/>
                        {!isEditingPassword ? (
                            <>
                                <button
                                    onClick={handleEditPasswordClick}
                                    className="edit-password-button"
                                >
                                    Edit
                                </button>
                            </>
                        ) : (
                            <>
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="current-password-input"
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={handleNewPasswordChange}
                                    className="new-password-input"
                                />
                                <button onClick={handleSavePasswordClick} className="save-password-button">Save</button>
                                <button onClick={handleCancelPasswordEdit} className="cancel-password-button">Cancel</button>
                            </>
                        )}
                    </p>
                    {passwordUpdateError && <p className="error-message">{passwordUpdateError}</p>}
                    {passwordUpdateSuccess && <p className="success-message">{passwordUpdateSuccess}</p>}
                </div>
            </div>

            <h2 className='Heading_two'> My Cabinets</h2>

            <div className="collections-container">
                {collectionsData.map(collection => (
                    <div className="collection-box" key={collection.id}>
                        <h3 className="collection-title">{collection.name}</h3>

                        {collection.story && collection.story.length > 0 && (
                            <div className="story-box">
                                {collection.story.map((storyItem, index) => (
                                    <div key={index} className="single-story">
                                        <strong className="story-title">{storyItem.title}</strong>
                                        <p className="story-text">
                                            {storyItem.narrative || 'No story available'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="images-grid">
                            {collection.images.map((img, index) => (
                                <div className="image-box" key={img.id || index}>
                                    <img
                                        src={img.imageUrl}
                                        alt={`Image ${index + 1}`}
                                        className="collection-image"
                                    />
                                </div>
                            ))}
                        </div>

                        {collection.images.length === 0 && (
                            <p className="no-images-text">No images in this Cabinet.</p>
                        )}
                    </div>
                ))}

                {collectionsData.length === 0 && (
                    <p className="no-collections-text">Cabinets Loading....</p>
                )}
            </div>

            <ScrollToTopButton />

            <footer>
                <div className="footer">
                    <h6 className="footer_text">Copyright © 2025 The Thinking Cabinet. All rights reserved.</h6>
                </div>
            </footer>
        </div>
    );
}

export default Profile;