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
  const [curResMessage, setCurResMessage] = useState("");
  const [standingTextIntervalId, setStandingTextIntervalId] = useState(-1);

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

    // Add standing text
    setData((prevData) => [
      ...prevData,
      {
        role: "ai",
        text: "",
      },
    ]);

    let currentText = ".";
    let dotCount = 0;
    let intervalId = setInterval(() => {
      currentText += ".";
      dotCount++;
      if (dotCount == 3) {
        dotCount = 0;
        currentText = ".";
      }
      setData((prevData) => [
        ...prevData.slice(0, prevData.length - 1),
        {
          role: "ai",
          text: currentText,
        },
      ]);
    }, 300);
    setStandingTextIntervalId(intervalId);

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
      // Set Current Response from chatGPT.
      setCurResMessage(newData.text);

      // Start talking
      talkBtnClick(newData.text);
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

  const switchToggleRef = useRef(null);
  const [mode, setMode] = useState(1); // 1: Text, -1 : Speech
  const standVideoRef = useRef(null); // Standing Video
  const talkVideoRef = useRef(null); // Talking Video
  const [isStandOrTalk, setStandOrTalk] = useState(2); // 2: Stand, 1: Stand fading | -2: Talk, -1: Talk fading
  const [talkDuration, setTalkDuration] = useState(0);

  const talkBtnClick = async (inputText) => {
    if (
      peerConnection?.signalingState === "stable" ||
      peerConnection?.iceConnectionState === "connected"
    ) {
      // console.log("audioURL: ", audioURL);
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
      })
        .then((res) => {
          console.log("talkResponse: ", res);
          res
            .json()
            .then((data) => {
              console.log("data:", data);
              setTalkDuration(data.duration);
              talkVideoRef.current.play();
            })
            .catch((err) => {
              console.log("talkResponse JSON err: ", err);
            });
        })
        .catch((err) => {
          console.log("talkResponse err: ", err);
        });
    }
  };

  const connectBtnClick = async () => {
    console.log("connectBtnClick");

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
        source_url:
          "https://i.ibb.co/Db6qzTj/1682624829325-00-00-00-20230428-045418-0.png",
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

    //return a session description
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
    })
      .then((res) => {
        console.log("sdpResponse: ", res);
      })
      .catch((err) => {
        console.log("sdpResponse err: ", err);
      });
  };

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
    pc.removeEventListener(
      "signalingstatechange",
      onSignalingStateChange,
      true
    );
    pc.removeEventListener("track", onTrack, true);
    // document.getElementById("ice-gathering-status-label").innerText = "";
    // document.getElementById("signaling-status-label").innerText = "";
    // document.getElementById("ice-status-label").innerText = "";
    // document.getElementById("peer-status-label").innerText = "";
    console.log("stopped peer connection");
    if (pc === peerConnection) {
      peerConnection = null;
    }
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

  function onIceGatheringStateChange() {
    // document.getElementById("ice-gathering-status-label").innerText =
    //   peerConnection.iceGatheringState;
    // document.getElementById("ice-gathering-status-label").className =
    //   "iceGatheringState-" + peerConnection.iceGatheringState;
  }
  function onIceCandidate(event) {
    console.log("onIceCandidate", event);
    if (event.candidate) {
      const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

      fetch(`/api/chatdid/submitNetInf`, {
        body: JSON.stringify({
          streamId,
          candidate,
          sdpMid,
          sdpMLineIndex,
          sessionId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    }
  }
  function onIceConnectionStateChange() {
    // document.getElementById("ice-status-label").innerText =
    //   peerConnection.iceConnectionState;
    // document.getElementById("ice-status-label").className =
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
    // document.getElementById("peer-status-label").innerText =
    //   peerConnection.connectionState;
    // document.getElementById("peer-status-label").className =
    //   "peerConnectionState-" + peerConnection.connectionState;
  }
  function onSignalingStateChange() {
    // document.getElementById("signaling-status-label").innerText =
    //   peerConnection.signalingState;
    // document.getElementById("signaling-status-label").className =
    //   "signalingState-" + peerConnection.signalingState;
  }
  function onTrack(event) {
    const remoteStream = event.streams[0];
    // setVideoElement(remoteStream);
    talkVideoRef.current.srcObject = remoteStream;
  }
  // function setVideoElement(stream) {
  //   if (!stream) return;
  //   talkVideoRef.current.srcObject = stream;

  //   // safari hotfix
  //   if (talkVideoRef.current.paused) {
  //     talkVideoRef.current
  //       .play()
  //       .then((_) => {})
  //       .catch((e) => {});
  //   }
  // }

  useEffect(() => {
    scrollToLastMessage();
  }, [data]);

  useEffect(() => {
    connectBtnClick();
    switchTheme();
    // talkVideoRef.current.setAttribute("playsinline", "");
  }, []);

  function toggleTheme() {
    if (mode === 1) standVideoRef.current.play();
    else standVideoRef.current.pause();
    switchTheme(-mode);
    setMode(-mode);
  }
  function switchTheme(md) {
    //const switchToggle = document.querySelector("#switch-toggle");
    if (md == -1) {
      switchToggleRef.current.classList.remove(
        "bg-green-400",
        "-translate-x-2"
      );
      switchToggleRef.current.classList.add("bg-teal-400", "translate-x-full");
      setTimeout(() => {
        switchToggleRef.current.innerHTML = faceIcon;
      }, 250);
    } else {
      switchToggleRef.current.classList.add("bg-green-400", "-translate-x-2");
      switchToggleRef.current.classList.remove(
        "bg-teal-400",
        "translate-x-full"
      );
      setTimeout(() => {
        switchToggleRef.current.innerHTML = textIcon;
      }, 250);
    }
  }

  function onTalkVideoPlay() {
    console.log("play for ", talkDuration, "seconds", Date.now() / 1000);
    setTimeout(() => {
      setStandOrTalk(1);
      setTimeout(() => {
        setStandOrTalk(-1);
        setTimeout(() => {
          setStandOrTalk(-2);
        }, process.env.NEXT_PUBLIC_FADING_DURATION);
      }, process.env.NEXT_PUBLIC_FADING_DURATION);
    }, 1200);
    setTimeout(() => {
      console.log("pause", Date.now() / 1000);
      talkVideoRef.current.pause();
      setStandOrTalk(-1);
      setTimeout(() => {
        setStandOrTalk(1);
        setTimeout(() => {
          setStandOrTalk(2);
        }, process.env.NEXT_PUBLIC_FADING_DURATION);
      }, process.env.NEXT_PUBLIC_FADING_DURATION);
    }, talkDuration * 1000 + 1000);
    setTimeout(() => {
      // Clear standing text
      clearInterval(standingTextIntervalId);
      // Update the last message in the chat container with the current text
      let currentText = "";
      const streamingDelay =
        (talkDuration * 1000 - 3000) / curResMessage.length; // Time in milliseconds between each character appearing
      for (let i = 0; i < curResMessage.length; i++) {
        setTimeout(() => {
          currentText += curResMessage[i];
          setData((prevData) => [
            ...prevData.slice(0, prevData.length - 1),
            {
              role: "ai",
              text: currentText,
            },
          ]);
        }, i * streamingDelay);
      }
    }, 2500);
  }
  function onTalkVideoPause() {
    console.log("pause");
  }
  function onTalkVideoSuspend() {
    console.log("suspend");
  }
  function onTalkVideoWaiting() {
    console.log("waiting");
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
                  ref={switchToggleRef}
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
              mode === 1 ? "hidden" : ""
            } w-full flex justify-center`}
          >
            <div
              id="video-wrapper"
              className={`${styles.chatContainer} rounded-md mb-2 shadow-md w-[16rem] h-[16rem] `}
            >
              {/* added "id=video-wrapper" */}
              <div
                className={`transition transform ease-in-out duration-${
                  process.env.NEXT_PUBLIC_FADING_DURATION
                }  ${isStandOrTalk === -1 ? "opacity-30" : "opacity-100"} ${
                  isStandOrTalk > 0 ? "hidden" : ""
                }`}
              >
                <video
                  ref={talkVideoRef}
                  id="talk-video"
                  width="512"
                  height="512"
                  autoPlay
                  playsInline
                  onPlay={onTalkVideoPlay}
                ></video>
              </div>
              <div
                className={`transition transform ease-in-out duration-${
                  process.env.NEXT_PUBLIC_FADING_DURATION
                }  ${isStandOrTalk === 1 ? "opacity-30" : "opacity-100"} ${
                  isStandOrTalk < 0 ? "hidden" : ""
                }`}
              >
                <video
                  ref={standVideoRef}
                  id="stand-video"
                  width="512"
                  height="512"
                  autoPlay
                  loop
                  playsInline
                  src="standing.mp4"
                  type="video/mp4"
                ></video>
              </div>
            </div>
          </div>
          {/* Chat container */}
          <div
            className={`${styles.chatContainer} ${
              mode === -1 ? "" : "" //mode === -1 ? "hidden" : ""
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
              onClick={connectBtnClick}
            >
              Connect
            </button>

            {/* button for Test*/}
            <button
              className="inline-flex mt-5 mr-1 items-center px-4 py-2 border border-white text-white bg-blue-500 hover:bg-black hover:border-white-500 hover:text-white-500 shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              type="button"
              onClick={() => {
                setStandOrTalk(1);
                setTimeout(() => {
                  setStandOrTalk(-1);
                  setTimeout(() => {
                    setStandOrTalk(-2);
                  }, process.env.NEXT_PUBLIC_FADING_DURATION);
                }, process.env.NEXT_PUBLIC_FADING_DURATION);
                console.log(process.env.NEXT_PUBLIC_FADING_DURATION);
              }}
            >
              Test
            </button>
            {/* <span>isStandOrTalk:{isStandOrTalk}</span> */}
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
