import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useState, useEffect, Fragment, useRef } from "react";
import { faceIcon, textIcon } from "./svgs.js";
import Logo from "../components/Logo";

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;

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
          www.lawforall.co.za{" "}
        </a>
      </p>
      <p className={styles.center}>
        &copy; {new Date().getFullYear()} Law For All. All rights reserved.
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
    setData((prevData) => [...prevData, { role: "user", text: userMessage }]);
    setUserMessage(""); // Clear the input box immediately

    const res = await fetch(`/api/openai`, {
      body: JSON.stringify({
        userInput: userMessage,
        conversationHistory: data
          .map((message) => `${message.role}: ${message.text}`)
          .join("\n"),
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

      // Start talking
      startTalk(responseText);

      const streamingDelay = 10; // Time in milliseconds between each character appearing
      let currentText = "";
      setData((prevData) => [
        // Update the last message in the chat container with the current text
        ...prevData,
        {
          role: "ai",
          text: "",
        },
      ]);
      for (let i = 0; i < responseText.length; i++) {
        setTimeout(() => {
          currentText += responseText[i];
          setData((prevData) => [
            // Update the last message in the chat container with the current text
            ...prevData.slice(0, prevData.length - 1),
            {
              role: "ai",
              text: currentText,
            },
          ]);
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

  const [mode, setMode] = useState(1); // 1: Text, -1 : Speech
  const talkVideoRef = useRef(null);

  function onTrack(event) {
    const remoteStream = event.streams[0];
    setVideoElement(remoteStream);
  }

  async function createPeerConnection(offer, iceServers) {
    // console.log("offer", offer);
    // console.log("iceServers", iceServers);
    if (!peerConnection) {
      setPeerConnection(new RTCPeerConnection({ iceServers }));
      peerConnection.addEventListener(
        "icegatheringstatechange",
        onIceGatheringStateChange,
        true
      );
      peerConnection.addEventListener("icecandidate", onIceCandidate, true);
      peerConnection.addEventListener(
        "iceconnectionstatechange",
        onIceConnectionStateChange,
        true
      );
      peerConnection.addEventListener(
        "connectionstatechange",
        onConnectionStateChange,
        true
      );
      peerConnection.addEventListener(
        "signalingstatechange",
        onSignalingStateChange,
        true
      );
      peerConnection.addEventListener("track", onTrack, true);
    }

    await peerConnection.setRemoteDescription(offer);
    console.log("set remote sdp OK");

    const sessionClientAnswer = await peerConnection.createAnswer();
    console.log("create local sdp OK");

    await peerConnection.setLocalDescription(sessionClientAnswer);
    console.log("set local sdp OK");

    return sessionClientAnswer;
  }

  function setVideoElement(stream) {
    if (!stream) return;
    talkVideoRef.current.srcObject = stream;

    // safari hotfix
    if (talkVideoRef.current.paused) {
      talkVideoRef.current
        .play()
        .then((_) => {})
        .catch((e) => {});
    }
  }

  function stopAllStreams() {
    if (talkVideoRef.current.srcObject) {
      console.log("stopping video streams");
      talkVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
      talkVideoRef.current.srcObject = null;
    }
  }

  function closePC(pc = peerConnection) {
    if (!pc) return;
    console.log("stopping peer connection");
    pc.close();
    pc.removeEventListener(
      "icegatheringstatechange",
      onIceGatheringStateChange,
      true
    );
    pc.removeEventListener("icecandidate", onIceCandidate, true);
    pc.removeEventListener(
      "iceconnectionstatechange",
      onIceConnectionStateChange,
      true
    );
    pc.removeEventListener(
      "connectionstatechange",
      onConnectionStateChange,
      true
    );
    pc.removeEventListener("track", onTrack, true);
    console.log("stopped peer connection");
    if (pc === peerConnection) {
      setPeerConnection(null);
    }
  }

  const createTalk = async () => {
    if (peerConnection && peerConnection.connectionState === "connected") {
      return;
    }

    stopAllStreams();
    closePC();

    const sessionResponse = await fetch(`api/chatdid/createTalk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: "https://clips-presenters.d-id.com/jess/thumbnail.png",
      }),
    });

    const {
      id: newStreamId,
      offer,
      ice_servers: iceServers,
      session_id: newSessionId,
    } = await sessionResponse.json();

    setStreamId(newStreamId);
    setSessionId(newSessionId);

    try {
      let newSessionClientAnswer = await createPeerConnection(
        offer,
        iceServers
      );
      setSessionClientAnswer(newSessionClientAnswer);
    } catch (e) {
      console.log("error during streaming setup", e);
      stopAllStreams();
      closePC();
      return;
    }

    const sdpResponse = await fetch(`api/chatdid/startStream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        streamId,
        sessionClientAnswer,
        sessionId,
      }),
    });
  };

  const startTalk = async (inputText) => {
    // connectionState not supported in firefox
    // console.log("peerConnection", peerConnection);
    //    inputText = "Hi there, how can I help you with a legal matter today?";
    console.log("inputText: ", inputText);
    if (
      peerConnection?.signalingState === "stable" ||
      peerConnection?.iceConnectionState === "connected"
    ) {
      const talkResponse = await fetch(`/api/chatdid/createStream`, {
        body: JSON.stringify({
          streamId: streamId,
          sessionId: sessionId,
          inputText: inputText,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    }
  };

  const destroyTalk = async () => {
    await fetch(`api/chatdid/deleteTalkStream`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ streamId, sessionId }),
    });

    stopAllStreams();
    closePC();
  };

  useEffect(() => {
    scrollToLastMessage();
  }, [data]);

  useEffect(() => {
    switchTheme();
    talkVideoRef.current.setAttribute("playsinline", "");
    if (typeof window !== "undefined") {
      setRTCPeerConnection(
        (
          window.RTCPeerConnection ||
          window.webkitRTCPeerConnection ||
          window.mozRTCPeerConnection
        ).bind(window)
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        destroyTalk();
      }
    };
  }, []);

  function toggleTheme() {
    setMode(-mode);
    switchTheme(-mode);
  }
  function switchTheme(md) {
    const switchToggle = document.querySelector("#switch-toggle");
    if (md == -1) {
      switchToggle.classList.remove("bg-green-400", "-translate-x-2");
      switchToggle.classList.add("bg-teal-400", "translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML = faceIcon;
      }, 250);
    } else {
      switchToggle.classList.add("bg-green-400", "-translate-x-2");
      switchToggle.classList.remove("bg-teal-400", "translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML = textIcon;
      }, 250);
    }
  }

  // What we want to render
  return (
    <Fragment>
      <Head>
        <title>JJ GPT-3 App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-500 min-h-screen px-4 py-2 sm:px-6 sm:py-4 md:grid md:place-items-center lg:px-8">
        <main className="flex flex-col justify-center max-w-3xl w-full align-center">
          <Logo size={100} />
          {/* <h1 className="text-4xl text-center font-extrabold text-black-900 drop-shadow sm:text-5xl mb-1">
            Law For All
          </h1> */}
          <p className="block text-xl text-center font-medium text-gray-800 mb-4 mt-5">
            Welcome, how can we assist you today with your legal needs?
          </p>
          <div className="flex justify-center my-4">
            <div>
              <button
                className="w-20 h-10 rounded-full bg-white flex items-center transition duration-300 focus:outline-none shadow"
                onClick={toggleTheme}
              >
                <div
                  id="switch-toggle"
                  className="w-12 h-12 relative rounded-full transition duration-500 transform bg-green-400 -translate-x-2 p-1 text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </button>
            </div>
          </div>
          <div
            className={`${
              mode == 1 ? "hidden" : ""
            } w-full flex justify-center`}
          >
            <div
              id="video-wrapper"
              className={`${styles.chatContainer} rounded-md mb-2 shadow-md w-[16rem] h-[16rem] `}
            >
              {/* added "id=video-wrapper" */}
              <video
                ref={talkVideoRef}
                id="talk-video"
                width="270"
                height="270"
                autoPlay
              ></video>
            </div>
          </div>
          {/* Chat container */}
          <div
            className={`${styles.chatContainer} ${
              mode == -1 ? "" : "" //mode == -1 ? "hidden" : ""
            } p-4 rounded-md shadow-md h-[10rem]`}
          >
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
              onClick={() =>
                (window.location.href = "https://www.lawforall.co.za")
              }
            >
              Join
            </button>
            {/* button for Connect*/}
            <button
              className="inline-flex mt-5 mr-1 items-center px-4 py-2 border border-white text-white bg-blue-500 hover:bg-black hover:border-white-500 hover:text-white-500 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="button"
              onClick={createTalk}
            >
              Connect
            </button>

            {/* button for Test*/}
            <button
              className="inline-flex mt-5 mr-1 items-center px-4 py-2 border border-white text-white bg-blue-500 hover:bg-black hover:border-white-500 hover:text-white-500 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="button"
              onClick={startTalk}
            >
              Test
            </button>
          </form>
        </main>
        {/* Disclaimer and Footer */}
        <div className="flex flex-col items-center  w-full my-2">
          {/* Disclaimer */}
          <p className="block text-xs text-center font-small bg-[#f68c1f] text-gray-700 py-1 my-2">
            Disclaimer: This is an artificial chatbot, not a certified legal
            expert. Its insights are based on machine learned comprehension of
            the law, and they may be incorrect from time to time. For precise
            and comprehensive guidance on your legal concerns, please consult an
            experienced legal professional. At Law for All, our team of
            qualified legal advisors can offer you thorough and accurate advice
            tailored to your circumstances. Visit our website at
            www.lawforall.co.za to learn more about our services.
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
