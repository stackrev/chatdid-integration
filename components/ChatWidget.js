// ChatWidget.js
import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/ChatWidget.module.css"; // Create a ChatWidget.module.css file for custom styles

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState([]);
  const [userMessage, setUserMessage] = useState("");

  function handleResetClick() {
    setData([]);
    setUserMessage("");
  }

  async function sendMessage(e) {
    e.preventDefault();
    setData([...data, { role: "user", text: userMessage }]);
    setUserMessage("");

    // Call the API here as you have done before
  }

  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data]);

  return (
    <div className={styles.chatWidget}>
      <button
        className={styles.chatToggleButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        Chat
      </button>
      {isOpen && (
        <div className={styles.chatPopup}>
          {/* Chat container */}
          <div className={styles.chatContainer}>
            {data.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
                ref={index === data.length - 1 ? lastMessageRef : null}
              >
                <div
                  className={`rounded-md px-4 py-2 mb-4 ${
                    message.role === "user"
                      ? styles.userbubble
                      : styles.aibubble
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input field for user messages */}
          <form onSubmit={sendMessage} className="mt-4">
            <input
              className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md "
              type="text"
              value={userMessage}
              onChange={(event) => setUserMessage(event.target.value)}
              placeholder="Type your message here..."
            />
            <button
              className="inline-flex mt-5 mr-1 items-center px-4 py-2 border border-transparent text-white bg-blue-500 hover:bg-black hover:border-white-500 hover:text-white-500 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="submit"
            >
              Send
            </button>
            <button
              className="inline-flex mt-5 mr-1 items-center px-4 py-2 border border-transparent text-white bg-blue-500 hover:bg-black hover:border-white-500 hover:text-white-500 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="button"
              onClick={handleResetClick}
            >
              Reset
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
