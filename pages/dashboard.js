import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useState, useEffect, Fragment, useRef } from "react";

const DID_API = {
  key: "amFuamFubmFndGVnYWFsQGdtYWlsLmNvbQ:q0t4SOneT7749CA9ZT-Gs",
  url: "https://api.d-id.com",
};

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
  const [mode, setMode] = useState(1); // 1: Text, -1 : Speech
  const talkVideoRef = useRef(null);

  const [livePeer, setLivePeer] = useState({});
  const [liveStreamId, setLiveStreamId] = useState(null);
  const [liveSessionId, setLiveSessionId] = useState(null);
  let peerConnection;
  let streamId;
  let sessionId;
  let sessionClientAnswer;

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

  function onIceGatheringStateChange() {
    // iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
    // iceGatheringStatusLabel.className =
    //   "iceGatheringState-" + peerConnection.iceGatheringState;
  }
  function onIceCandidate(event) {
    console.log("onIceCandidate", event);
    if (event.candidate) {
      const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

      fetch(`${DID_API.url}/talks/streams/${streamId}/ice`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidate,
          sdpMid,
          sdpMLineIndex,
          session_id: sessionId,
        }),
      });
    }
  }
  function onIceConnectionStateChange() {
    // iceStatusLabel.innerText = peerConnection.iceConnectionState;
    // iceStatusLabel.className =
    //   "iceConnectionState-" + peerConnection.iceConnectionState;
    if (
      peerConnection.iceConnectionState === "failed" ||
      peerConnection.iceConnectionState === "closed"
    ) {
      stopAllStreams();
      closePC();
    }
  }
  function onConnectionStateChange() {
    // not supported in firefox
    // peerStatusLabel.innerText = peerConnection.connectionState;
    // peerStatusLabel.className =
    //   "peerConnectionState-" + peerConnection.connectionState;
  }
  function onSignalingStateChange() {
    // signalingStatusLabel.innerText = peerConnection.signalingState;
    // signalingStatusLabel.className =
    //   "signalingState-" + peerConnection.signalingState;
  }
  function onTrack(event) {
    const remoteStream = event.streams[0];
    setVideoElement(remoteStream);
  }

  async function createPeerConnection(offer, iceServers) {
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({ iceServers });
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
    // iceGatheringStatusLabel.innerText = "";
    // signalingStatusLabel.innerText = "";
    // iceStatusLabel.innerText = "";
    // peerStatusLabel.innerText = "";
    console.log("stopped peer connection");
    if (pc === peerConnection) {
      peerConnection = null;
    }
  }

  const connectToDid = async () => {
    if (peerConnection && peerConnection.connectionState === "connected") {
      return;
    }

    stopAllStreams();
    closePC();

    const sessionResponse = await fetch(`${DID_API.url}/talks/streams`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: "https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg",
      }),
    });

    const {
      id: newStreamId,
      offer,
      ice_servers: iceServers,
      session_id: newSessionId,
    } = await sessionResponse.json();
    streamId = newStreamId;
    sessionId = newSessionId;

    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      console.log("error during streaming setup", e);
      stopAllStreams();
      closePC();
      return;
    }

    setLivePeer(peerConnection);
    setLiveStreamId(streamId);
    setLiveSessionId(sessionId);

    const sdpResponse = await fetch(
      `${DID_API.url}/talks/streams/${streamId}/sdp`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${DID_API.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: sessionClientAnswer,
          session_id: sessionId,
        }),
      }
    );
  };

  const startTalk = async () => {
    // connectionState not supported in firefox
    console.log("peerConnection", livePeer);
    if (
      livePeer?.signalingState === "stable" ||
      livePeer?.iceConnectionState === "connected"
    ) {
      const talkResponse = await fetch(`/api/chatdid/createStream`, {
        body: JSON.stringify({
          streamId: liveStreamId,
          sessionId: liveSessionId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    }
  };

  const destroyTalk = async () => {
    await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    stopAllStreams();
    closePC();
  };

  useEffect(() => {
    scrollToLastMessage();
    switchTheme();
    talkVideoRef.current.setAttribute("playsinline", "");
    connectToDid();
  }, [data]);

  function toggleTheme() {
    setMode(-mode);
    console.log(mode);
    switchTheme(-mode);
  }
  function switchTheme(md) {
    const switchToggle = document.querySelector("#switch-toggle");
    const faceIcon = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"  version="1.1" id="Capa_1" viewBox="0 0 297.527 297.527" xml:space="preserve">
    <path d="M148.575,0C113.68,0,94.062,13.113,83.894,25.281C73.411,37.826,70.435,48.966,70.027,50.91  c-1.665,7-31.652,133.691-32.413,175.751c-5.616,13.287-8.829,26.931-8.829,36.83c0,3.034,1.753,6.555,4.5,7.844  c42.582,19.989,82.733,26.193,116.144,26.192c17.588,0,33.311-1.896,46.529-4.22c41.635-7.319,67.704-21.974,68.795-22.586  c2.465-1.385,3.989-4.361,3.989-7.189c0-9.941-3.24-23.614-8.899-36.954c-1.065-42.716-30.746-167.7-32.4-174.653  c-0.407-1.944-3.383-14.112-13.866-26.658C203.408,13.099,183.47,0,148.575,0z M242.146,197.217  c-8.411-9.563-18.373-16.217-29.22-16.217h-23.163v-17.798c6-6.827,10.445-14.562,14.307-22.32c1.345-0.24,2.683-0.682,4.021-1.32  c6.146-2.936,11.715-10.093,14.908-19.142c1.225-3.47,1.985-6.877,2.346-9.96C231.674,138.798,238.629,172.262,242.146,197.217z   M88.38,103.829c9.162-1.597,41.205-8.646,60.195-32.447c8.308,11.082,25.26,26.118,61.132,33.187  c0.297,2.117,0.218,5.857-1.471,10.643c-2.104,5.963-5.143,9.113-6.529,10.022c-1.617-0.531-3.372-0.525-5.003,0.04  c-2.048,0.709-3.706,2.235-4.586,4.216c-8.424,18.957-24.783,41.093-43.179,41.093c-18.437,0-34.801-22.202-43.224-41.216  c-0.912-2.058-2.639-3.623-4.786-4.297c-1.678-0.525-3.414-0.467-5.036,0.14c-1.404-0.939-4.303-4.086-6.388-9.996  C87.599,109.805,87.946,105.729,88.38,103.829z M114.856,196c4.322,0,8.907-0.957,8.907-5.279V177.83  c8,5.203,16.09,8.401,25.163,8.401c9.341,0,17.837-3.401,25.837-8.883v13.372c0,4.322,4.628,5.279,8.95,5.279h1.198l-36.148,52.286  L113.614,196H114.856z M148.575,14c54.114,0,63.208,39.132,63.539,40.781c0.022,0.119,0.048-0.508,0.076-0.39  c0.113,0.477,4.188,16.917,9.402,39.567c-1.355-1.59-3.061-2.776-5.073-3.62c-0.734-0.418-1.544-0.709-2.421-0.874  c-49.233-9.259-57.418-34.347-57.995-36.074c-0.423-1.266-2.153-4.89-7.528-4.89c-5,0-6.094,3.014-7.042,4.89  C126.311,83.515,84.3,88.643,83.876,88.698c-1.082,0.139-2.083,0.494-2.967,1.015c-1.811,0.799-3.364,1.949-4.64,3.41  c5.021-21.938,8.899-37.644,9.01-38.109c0.021-0.091,0.05-0.1,0.068-0.19C85.687,53.132,94.459,14,148.575,14z M72.258,110.933  c0.375,3.009,1.112,6.189,2.275,9.487c2.132,6.042,5.41,11.4,9.231,15.092c3.152,3.046,6.599,4.887,10.045,5.418  c4.012,8.054,8.955,16.069,14.955,23.074V181H84.601c-10.725,0-20.582,6.512-28.933,15.898  C59.21,171.973,66.044,138.98,72.258,110.933z M193.248,277.547c-35.17,6.184-89.117,7.06-148.528-19.44  C47.302,234.545,66.99,196,84.601,196H94.79l47.479,70.876c1.454,2.162,3.889,3.558,6.494,3.558s5.04-1.445,6.494-3.607L203.943,196  h8.983c17.667,0,37.426,38.517,39.905,62.066C244.202,262.209,222.899,272.334,193.248,277.547z" fill="#FBFBFF"/>
    </svg>`;

    const textIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <path d="M9 12C9 12.5523 8.55228 13 8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11C8.55228 11 9 11.4477 9 12Z" fill="#FBFBFF"/>
    <path d="M13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12Z" fill="#FBFBFF"/>
    <path d="M17 12C17 12.5523 16.5523 13 16 13C15.4477 13 15 12.5523 15 12C15 11.4477 15.4477 11 16 11C16.5523 11 17 11.4477 17 12Z" fill="#FBFBFF"/>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="#FBFBFF" stroke-width="1.5"/>
  </svg>`;
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  opacity: 1,
                  position: "relative",
                  marginBottom: "1rem",
                  borderRadius: "30px",
                  boxShadow: "0 8px 8px rgba(0, 0, 0, 0.25)",
                  overflow: "hidden", // Add this to clip the image within the container
                }}
              >
                <Image
                  onClick={() =>
                    (window.location.href = "https://www.lawforall.co.za")
                  }
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
              className={`${styles.chatContainer}  p-4 rounded-md shadow-md w-[10rem] h-[10rem] `}
            >
              {/* added "id=video-wrapper" */}
              <video
                ref={talkVideoRef}
                id="talk-video"
                width="400"
                height="400"
                autoPlay
              ></video>
            </div>
          </div>
          {/* Chat container */}
          <div
            className={`${styles.chatContainer} ${
              mode == -1 ? "hidden" : ""
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

            {/* button for Whatsapp*/}
            <button
              className="inline-flex mt-5 mr-1 items-center px-4 py-2 border border-white text-white bg-blue-500 hover:bg-black hover:border-white-500 hover:text-white-500 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="button"
              onClick={startTalk}
            >
              Whatsapp
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
