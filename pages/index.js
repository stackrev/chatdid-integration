import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useState, useEffect, Fragment, useRef } from "react";

function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.center}>
        <a href="tel:0861994499">0861994499</a>
      </p>
      <p className={styles.center}>
        <a href="mailto:info@lawforall.co.za">info@lawforall.co.za</a>
      </p>
      <p className={styles.center}>
        <a href="https://www.lawforall.co.za" target="_blank" rel="noreferrer">
        www.lawforall.co.za </a>
      </p>
      <p className={styles.center}>
        &copy; {(new Date()).getFullYear()} Law For All. All rights reserved.
      </p>
    </footer>
  );
}


export default function Home() {
  // React Hooks
  const [data, setData] = useState([]);
  const [userMessage, setUserMessage] = useState("");

  function handleResetClick() {
    // reset the conversation session
    setData([]);
    // clear the user input
    setUserMessage(""); // Add this line to clear the input
  }

  // Fetch data from API
  async function sendMessage(e) {
    e.preventDefault();
  
    // Add the user's message to the chat container immediately
    setData(prevData => [...prevData, { role: 'user', text: userMessage }]);
    setUserMessage(''); // Clear the input box immediately
  
    const res = await fetch(`/api/openai`, {
      body: JSON.stringify({
        userInput: userMessage,
        conversationHistory: data.map(message => `${message.role}: ${message.text}`).join('\n'),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  
    const newData = await res.json();
  
    if (newData && newData.text) {
      // Simulate streaming the AI's response
      const responseText = newData.text;
      const streamingDelay = 10; // Time in milliseconds between each character appearing
      let currentText = '';
  
      for (let i = 0; i < responseText.length; i++) {
        setTimeout(() => {
          currentText += responseText[i];
          setData(prevData => {
            // Update the last message in the chat container with the current text
            const updatedData = [...prevData];
            updatedData[updatedData.length - 1] = { role: 'ai', text: currentText };
            return updatedData;
          });
        }, i * streamingDelay);
      }
    } else {
      console.error("Failed to get AI response.");
    }
  }
  
  
  
  
  


  
  const lastMessageRef = useRef(null);
  const scrollToLastMessage = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToLastMessage();
  }, [data]);



  // What we want to render
  return (
    <Fragment>
      <Head>
        <title>JJ GPT-3 App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-500 min-h-screen px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
        <main className="flex flex-col justify-center max-w-3xl w-full align-center">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  opacity: 1,
                  position: 'relative',
                  marginBottom: '1rem',
                  borderRadius: '30px',
                  boxShadow: '0 8px 8px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden', // Add this to clip the image within the container
                }}
              >
                <Image
                  onClick={() => window.location.href = 'https://www.lawforall.co.za'}
                  src="/logo.png"
                  alt="Logo"
                  width={200}
                  height={200}
                  className={styles.roundedLogo} // Add the class here
                  
                />
              </div>
            </div>
          </div>
          {/* <h1 className="text-4xl text-center font-extrabold text-black-900 drop-shadow sm:text-5xl mb-1">
            Law For All
          </h1> */}
          <p className="block text-xl text-center font-medium text-gray-800 mb-4 mt-5">
            Welcome, how can we assist you today with your legal needs?

          </p>

          {/* Chat container */}
          <div className={`${styles.chatContainer} p-4 rounded-md shadow-md`}>
            {data.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                ref={index === data.length - 1 ? lastMessageRef : null}
              >
                <div
                  className={`rounded-md px-4 py-2 mb-4 ${message.role === "user"
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
            {/* button that submits form */}
            <button
              className="inline-flex mt-5 mr-1 items-center px-4 py-2 border border-white text-white bg-blue-500 hover:bg-black hover:border-white-500 hover:text-white-500 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="submit"
              >
              Send
            </button>

            {/* button that reset conversation session*/}
            <button
              className="inline-flex mt-5 mr-1 items-center px-4 py-2 border border-white text-white bg-blue-500 hover:bg-black hover:border-white-500 hover:text-white-500 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="button"
              onClick={handleResetClick}
              >
              Reset
            </button>
            {/* button that redirects to another url  with left padding from other button*/}
            <button
              className="inline-flex mt-5 mr-1 items-center px-4 py-2 border border-white text-white bg-blue-500 hover:bg-black hover:border-white-500 hover:text-white-500 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="button"
              onClick={() => window.location.href = 'https://www.lawforall.co.za'}
              >
              Join
            </button>
            </form>
            </main>
            {/* Disclaimer and Footer */}
            <div className="flex flex-col items-center w-full mt-10">
              {/* Disclaimer */}
              <p className="block text-xs text-center font-small text-gray-600 mt-90">
                Disclaimer: This is an artificial chatbot, not a certified legal expert. Its insights are based on machine learned comprehension of the law, and they may be incorrect from time to time. For precise and comprehensive guidance on your legal concerns, please consult an experienced legal professional. At Law for All, our team of qualified legal advisors can offer you thorough and accurate advice tailored to your circumstances. Visit our website at www.lawforall.co.za to learn more about our services.
              </p>
              {/* Footer */}
              <Footer />
            </div>
          {/* </form>
        </main> */}
        {/* <Footer /> */}
      </div>
    </Fragment>
  );
}