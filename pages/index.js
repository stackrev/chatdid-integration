import Head from "next/head";
import Image from "next/image";
import logo from "../public/logo.png";
import styles from "../styles/Home.module.css";
import { useState, useEffect, Fragment, useRef } from "react";
import {
  EmojiHappyIcon as EmojiHappyIconSolid,
  EmojiSadIcon,
  FireIcon,
  HeartIcon,
  ThumbUpIcon,
  XIcon,
} from "@heroicons/react/solid";

const mySecret = process.env['OPENAI_API_KEY']

export default function Home() {
  // React Hooks
  const [data, setData] = useState([]);
  const [userMessage, setUserMessage] = useState("");

  // Fetch data from API
  const sendMessage = async (e) => {
    e.preventDefault();
    setData([...data, { role: 'user', text: userMessage }]);
    setUserMessage('');

    const res = await fetch(`/api/openai`, {
      body: JSON.stringify({
        userInput: userMessage,
        conversationHistory: data.map(message => message.text).join('\n'),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const newData = await res.json();
    setData([...data, { role: 'user', text: userMessage }, { role: 'ai', text: newData.text }]);
  };

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
      <div className="bg-gradient-to-r from-pink-100 to-blue-300 min-h-screen px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
        <main className="flex flex-col justify-center max-w-3xl w-full align-center">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  opacity: 0.9,
                  position: 'relative',
                  marginBottom: '1rem',
                  borderRadius: '30px',
                  boxShadow: '0 8px 8px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden', // Add this to clip the image within the container
                }}
              >
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={100}
                  height={100}
                  className={styles.roundedLogo} // Add the class here
                />
              </div>
            </div>
          </div>
          <h1 className="text-4xl text-center font-extrabold text-purple-900 drop-shadow sm:text-5xl mb-1">
            Lawyerly
          </h1>
          <p className="block text-sm text-center font-medium text-gray-500 mb-4">
            Welcome to Lawyerly! How can I assist you with your legal needs?

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
              className="shadow-sm block w-full focus:ring-pink-500 focus:border-purple-500 sm:text-sm border border-gray-300 rounded-md"
              type="text"
              value={userMessage}
              onChange={(event) => setUserMessage(event.target.value)}
              placeholder="Type your message here..."
            />
            <button
              className="inline-flex mt-5 items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-lightgrey hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="submit"
            >
              Send
            </button>
          </form>
        </main>
      </div>
    </Fragment>
  );
}