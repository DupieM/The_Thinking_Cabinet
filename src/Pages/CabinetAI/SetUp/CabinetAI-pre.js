import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import { useSharedData } from "../../../componements/SharedDataProvider";
import '../SetUp/CabinetAI-pre.css';
import ScrollToTopButton from "../../../componements/ScrollToTopButton";

function CabinetAIPre() {
  // creating const varibles to call functions and data
  const { setSharedData } = useSharedData();
  const [userId, setUserId] = useState("");
  const [tempImageList, setTempImageList] = useState([]);
  const [storyName, setStoryName] = useState("");
  const [genre, setGenre] = useState("");

  const navigate = useNavigate();

  // Help set the id of current user to create all collections
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUserId(currentUser?.uid);
    });
    return () => unsubscribe();
  }, []);

  // Handle open of fiel explorer and uploading the images
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result;
        const imageName = file.name.split(".")[0]; // remove extension
        const newImage = { name: imageName, url: imageUrl };
        setTempImageList((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Function thta activates the create story from page one to page two 
  const handleCreateStory = () => {
    if (!storyName.trim() || !genre.trim()) {
      alert("Please enter a story name and select a genre!");
      return;
    }
    setSharedData({ userId, storyName, genre, images: tempImageList });
    navigate("/cabinetAI-post");
  };

  return (
    <div className="App2">
      <div>
        <p className="Box">
          CabinetAI allows you to bring objects to life through AI-generated stories.
          Simply upload a pictures of objects, watch as AI creates a unique narrative,
          and save it under a collection name. You can also chat with AI to explore deeper
          meanings, ask questions, or gain new insights about your object.
        </p>
      </div>

      <h2 className="heading">Your Wunderkammer Objects</h2>

      <p style={{color: '#ebe4d1', fontSize: '15pt', fontStyle: 'italic'}}>
        Please note we strongly recommend that you rename your images to get the best story generated. <br/>
        You can do this by clicking in name box below each image
      </p>

      <div className="container_box">
        <div className="upload-container">
          <p className="upload-heading">Upload your objects</p>

          <label htmlFor="file-upload" className="upload-box">
            +
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          <p className="upload-count">{tempImageList.length} images selected</p>
        </div>

        {/* Carousel Section */}
        <div className="carousel_box">
          <div className="carousel" style={{ display: "flex", overflowX: "auto", padding: "20px 0", gap: "16px" }}>
            {tempImageList.map((img, index) => (
              <div className="image_box" key={index}>
                <div className="image_inner_box">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="object-image"
                  />
                  <input
                    type="text"
                    value={img.name}
                    onChange={(e) => {
                      const updatedImages = [...tempImageList];
                      updatedImages[index].name = e.target.value;
                      setTempImageList(updatedImages);
                    }}
                    className="rename-input"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="Stn">
        <h2>What would you like the story to be called?</h2>
        <input
          className="input"
          type="text"
          placeholder="Name of Story"
          value={storyName}
          onChange={(e) => setStoryName(e.target.value)}
        />
      </div>

      <div className="Stn2">
        <h2>In which genre should your story be created?</h2>
        <select
          className="dropdown"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          style={{ width: '270px', fontSize: '15pt', backgroundColor: '#FFFAF4' }}
        >
          <option value="">Select Genre</option>
          <option value="Romance">Romance</option>
          <option value="Fantasy">Fantasy</option>
          <option value="Science Fiction">Science Fiction</option>
          <option value="Mystery">Mystery</option>
          <option value="Horror">Horror</option>
          <option value="Adventure">Adventure</option>
          <option value="Drama">Drama</option>
          <option value="Poetry">Poetry</option>
          <option value="Thriller">Thriller</option>
        </select>
      </div>

      <button onClick={handleCreateStory} className="button">Create Story</button>

      <ScrollToTopButton />

      <footer>
        <div className="footer">
          <h6 className="footer_text">Copyright © 2025 The Thinking Cabinet. All rights reserved.</h6>
        </div>
      </footer>
    </div>
  );
}

export default CabinetAIPre;