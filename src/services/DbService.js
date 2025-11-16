import { db, storage } from "../firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

// Save story under a collection (not under a specific image)
export const saveStoryToCollection = async (userId, collectionId, storyName, genre, narrative) => {
    const storyRef = collection(db, "users", userId, "collections", collectionId, "stories");
  
    // Create a new document in the images collection for the story
    const newStoryDocRef = await addDoc(storyRef, {
      story: {
        title: storyName,
        genre: genre,
        narrative: narrative
      },
      timestamp: serverTimestamp()
    });
  
    console.log("Story saved successfully under images with ID:", newStoryDocRef.id);
  };
  
  

// Create a new collection and return the new collectionId
export const createImageCollection = async (userId, collectionName) => {
  try {
    const collectionsRef = collection(db, "users", userId, "collections");
    const newCollectionRef = await addDoc(collectionsRef, {
      collectionName,
      createdAt: serverTimestamp(),
    });
    return newCollectionRef.id;
  } catch (error) {
    console.error("Error creating collection:", error);
    throw error;
  }
};

// Save a single image under a collection
export const saveImageToFirestore = async (userId, collectionId, imageName, imageDataUrl) => {
  try {
    const storageRef = ref(storage, `users/${userId}/collections/${collectionId}/${imageName}`);

    // Upload image data
    await uploadString(storageRef, imageDataUrl, "data_url");
    const downloadUrl = await getDownloadURL(storageRef);

    // Ensure collection document exists
    const collectionDocRef = doc(db, "users", userId, "collections", collectionId);
    await setDoc(collectionDocRef, { createdAt: serverTimestamp() }, { merge: true });

    // Save image metadata in Firestore
    const imagesRef = collection(db, "users", userId, "collections", collectionId, "images");
    await addDoc(imagesRef, {
      name: imageName,
      url: downloadUrl,
      timestamp: serverTimestamp(),
    });

    return downloadUrl;
  } catch (error) {
    console.error("Error saving image:", error);
    throw error;
  }
};

// Fetch story text from stories/{storyName}
export const getStoryText = async (userId, collectionId, storyId) => {
  try {
    const storyRef = doc(db, "users", userId, "collections", collectionId, "stories", storyId);
    const storySnap = await getDoc(storyRef);
    if (storySnap.exists()) {
      return storySnap.data().narrative;
    } else {
      console.warn("No story found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching story:", error);
    return null;
  }
};

