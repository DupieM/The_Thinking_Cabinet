import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useSharedData } from "../../../componements/SharedDataProvider";
import { createImageCollection, saveImageToFirestore, saveStoryToCollection } from "../../../services/DbService";
import '../Reslut/CabinetAI-post.css';
import ScrollToTopButton from "../../../componements/ScrollToTopButton";
import { useNavigate } from "react-router-dom";

const API_URL = "https://api.openai.com/v1/chat/completions";

function CabinetAIPost() {

  const chatContainerRef = useRef(null);

  // creating const varibles to call functions and data
  const { sharedData } = useSharedData();
  const { storyName, genre, images, userId } = sharedData;

  const [narrative, setNarrative] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [isSavingCabinet, setIsSavingCabinet] = useState(false);

  const navigate = useNavigate();

  // Predefined Questions under each category
  const [questions] = useState({
    Debater: [
      "What assumptions does the main character make, and are they justified?",
      "Could the antagonist’s actions be seen as rational in any way?",
      "What ethical dilemmas are presented, and how are they resolved?",
      "Is the protagonist's victory truly deserved?",
      "How might a different character interpret these events?",
      "Were any key decisions rushed or flawed?",
      "Does the story present one-sided viewpoints?",
      "What might a skeptic say about the ending?",
    ],
    Philosopher: [
      "What does this story reveal about human nature?",
      "Are fate and free will at play in this narrative?",
      "How does the story define ‘good’ and ‘evil’?",
      "What moral or lesson lies beneath the plot?",
      "Does the story challenge conventional values?",
      "Is suffering necessary for growth in this story?",
      "How does the story explore identity or self-discovery?",
      "What deeper truth does the story try to express?",
    ],
    Therapist: [
      "What trauma or unresolved issue drives the main character?",
      "How does the protagonist evolve emotionally?",
      "What role do relationships play in character development?",
      "What fears or insecurities are hidden in the characters?",
      "Is there emotional healing by the end of the story?",
      "What does the story say about forgiveness?",
      "How are conflict and communication portrayed?",
      "What coping mechanisms are visible in the characters?",
    ],
    Muse: [
      "What would happen if the setting changed completely?",
      "Can you rewrite the story from another character’s perspective?",
      "What magical or sci-fi twist could be added?",
      "What if the main character had made the opposite decision?",
      "How would this story look as a poem or song?",
      "Can you describe a sequel to this story?",
      "What metaphor best represents the story’s journey?",
      "How could a visual artist bring this story to life?",
    ],
    Personal: [
      "Which character do you most relate to, and why?",
      "Has anything in your life mirrored a moment in the story?",
      "What part of the story moved you emotionally?",
      "Would you have made the same decisions as the protagonist?",
      "What did this story remind you of in your own experience?",
      "How did this story make you feel overall?",
      "What would you do differently if you were in the story?",
      "Does this story reflect a dream or fear you’ve had?",
    ],
  });

  const [selectedCategory, setSelectedCategory] = useState("");

  // Alklows for page to automnatically move up when landing on page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-generate story on page load
  useEffect(() => {
    generateStory();
  }, [images, genre, storyName]);

  // Function to generate my story with data from previous opage with OpenAI
  const generateStory = async () => {
      setIsLoadingStory(true); // show loader
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      let imageDescriptions = "The story includes these images: ";
      images.forEach((img, i) => {
        imageDescriptions += `${img.name}${i === images.length - 1 ? "" : ", "}`;
      });

      const prompt = `${imageDescriptions}. Write a ${genre} story titled "${storyName}" using around 150 to 170 words.`;

      try {
        const response = await axios.post(
          API_URL,
          {
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are an AI storyteller." },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        let generatedStory = response.data.choices[0].message.content.trim();

        // Remove the title if it's part of the generated story
        if (generatedStory.toLowerCase().startsWith(storyName.toLowerCase())) {
          generatedStory = generatedStory.slice(storyName.length).trim();
        }

        setNarrative(generatedStory);
      } catch (error) {
        console.error("Error generating story:", error);
      } finally {
        setIsLoadingStory(false); // hide loader
      }
    };

    // Function to allow to stay by new question when geneerating new ones
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Functions that handle the chat with AI based off of the story that is generated
  const handleChat = async () => {
    if (!userMessage.trim()) return;

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const systemPrompt = "You are an AI assistant designed to discuss a user's story. Please respond to questions and prompts about the story in no more than 60 words.";
    const messagesToSend = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here's the full story: ${narrative}` },
      ...chatMessages,
      { role: "user", content: userMessage },
    ];

    try {
      const response = await axios.post(
        API_URL,
        {
          model: "gpt-3.5-turbo",
          messages: messagesToSend,
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content.trim();
      setChatMessages([...chatMessages, { role: "user", content: userMessage }, { role: "assistant", content: aiResponse }]);
      setUserMessage("");
    } catch (error) {
      console.error("Error in chat:", error);
    }
  };

  // Function thath handle when a user save stheir cabinet to Firebase with images and narrative
  const handleSubmit = async () => {
    if (!collectionName.trim()) {
      alert("Please enter a collection name.");
      return;
    }

    setIsSavingCabinet(true); // show loader

    try {
      // 1. Create the collection and get its ID
      const collectionId = await createImageCollection(userId, collectionName);

      // 2. Save the story to the 'stories' subcollection
      await saveStoryToCollection(
        userId,
        collectionId,
        storyName,
        genre,
        narrative
      );

      // 3. Save each image to the 'images' subcollection
      for (const image of images) {
        await saveImageToFirestore(
          userId,
          collectionId,
          image.name,
          image.url
        );
      }
      setShowPopup(false);
      setSuccessMessage("Your collection has been saved successfully!");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save the story and images.");
    } finally {
      setIsSavingCabinet(false); // hide loader
    }
  };

  return (
    <div className="App2">
      <h2 className="heading">Your Story</h2>

      {/* Display images */}
      <div className="image-grid">
        <p className="subheading">Images in your cabinet</p>
        {images.map((img, index) => (
          <img key={index} src={img.url} alt={img.name} className="story_image"/>
        ))}
      </div>

      <p style={{color: '#ebe4d1', display: 'none'}}><strong>Genre:</strong> {genre}</p>

      {/* Generated story */}
      <div className="story_output">
        <h3 className="story_ouput_heading">{storyName}</h3>
         {isLoadingStory ? (
            <div className="spinner"></div>
          ) : (
            <p>{narrative}</p>
          )}
      </div>

      <button className="btn_save" onClick={() => setShowPopup(true)}>Create Cabinet</button>
      <button className="btn_generate" onClick={generateStory} style={{ marginLeft: '10px' }}>
        Generate Another Story
      </button>
      

      {/* Popup for collection name */}
      {showPopup && (
        <div className="welcome-modal">
          <div className="modal_content">
            <h3 className="save_heading">Save your images and story to view later, enter your cabinet name below to save it.</h3>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="e.g., MagicalRealismStories"
              className="popup-input"
            />
            <div style={{ marginTop: '20px' }}>
              <button className="btn-save" onClick={handleSubmit}>Confirm</button>
              <button className="btn-cancel" onClick={() => setShowPopup(false)} style={{ marginLeft: '10px' }}>
                Cancel
              </button>
            </div>

            {isSavingCabinet && (
              <div className="spinner"></div>
            )}

          </div>
        </div>
      )}

      {successMessage && (
        <div className="success-banner">
          {successMessage}
        </div>
      )}

      {/* AI Chat Section */}
      <h3 className="heading">Ask AI about your story:</h3>
      <p className="instruction_text">
        You can choose a category and select a question to ask about your story, or type your own custom question in the box below.
      </p>
      <div className="chat-section">
        <div>
          <select
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="dropdown"
          >
            <option value="">Pick a category...</option>
            {Object.keys(questions).map((category, idx) => (
              <option key={idx} value={category}>
                {category}
              </option>
            ))}
          </select>

          {selectedCategory && (
            <select
              onChange={(e) => e.target.value && setUserMessage(e.target.value)}
              className="dropdown2"
            >
              <option value="">Pick a question from category chosen above...</option>
              {questions[selectedCategory].map((question, idx) => (
                <option key={idx} value={question}>
                  {question}
                </option>
              ))}
            </select>
          )}
        </div>


        <div className="chat-input-group">
          <input
            className="chat-input"
            type="text"
            placeholder="Type your question..."
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
          />
          <button className="btn-send" onClick={handleChat}>Send</button>
        </div>

        <div className="chat-container"  ref={chatContainerRef}>
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={msg.role === "user" ? "user-message" : "ai-message"}
            >
              {msg.content}
            </div>
          ))}
        </div>

        
      </div>

      <button
        className="btn_generate"
        style={{marginTop: '20px'}}
        onClick={() =>
          navigate("/profile", {
            state: {
              storyName,
              genre,
              images,
              narrative,
              chatMessages
            },
          })
        }
      >
        Go to Profile
      </button>

      <ScrollToTopButton />

      <footer>
        <div className="footer">
          <h6 className="footer_text">Copyright © 2025 The Thinking Cabinet. All rights reserved.</h6>
        </div>
      </footer>
    </div>
  );
}

export default CabinetAIPost;