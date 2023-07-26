"use strict";
export let RTCPeerConnection;
export const setRTCPeerConnection = (newRTCPeerConnection) => {
  RTCPeerConnection = newRTCPeerConnection;
};
export let peerConnection;
export const setPeerConnection = (newPeerConnection) => {
  peerConnection = newPeerConnection;
};
export let streamId;
export const setStreamId = (newStreamId) => {
  streamId = newStreamId;
};
export let sessionId;
export const setSessionId = (newSessionId) => {
  sessionId = newSessionId;
};
export let sessionClientAnswer;
export const setSessionClientAnswer = (newSessionClientAnswer) => {
  sessionClientAnswer = newSessionClientAnswer;
};

// const talkVideo = document.getElementById("talk-video");
// talkVideo.setAttribute('playsinline', '');
// const peerStatusLabel = document.getElementById("peer-status-label");
// const iceStatusLabel = document.getElementById("ice-status-label");
// const iceGatheringStatusLabel = document.getElementById("ice-gathering-status-label");
// const signalingStatusLabel = document.getElementById("signaling-status-label");

// const connectButton = document.getElementById("connect-button");
// connectButton.onclick = async () => {
//   if (peerConnection && peerConnection.connectionState === "connected") {
//     return;
//   }

//   stopAllStreams();
//   closePC();

//   const sessionResponse = await fetch(`${process.env.DID_URL}/talks/streams`, {
//     method: "POST",
//     headers: {
//       Authorization: `Basic ${process.env.DID_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       source_url: "https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg",
//     }),
//   });

//   const {
//     id: newStreamId,
//     offer,
//     ice_servers: iceServers,
//     session_id: newSessionId,
//   } = await sessionResponse.json();
//   streamId = newStreamId;
//   sessionId = newSessionId;

//   try {
//     sessionClientAnswer = await createPeerConnection(offer, iceServers);
//   } catch (e) {
//     console.log("error during streaming setup", e);
//     stopAllStreams();
//     closePC();
//     return;
//   }

//   const sdpResponse = await fetch(
//     `${process.env.DID_URL}/talks/streams/${streamId}/sdp`,
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Basic ${process.env.DID_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         answer: sessionClientAnswer,
//         session_id: sessionId,
//       }),
//     }
//   );
// };

// const talkButton = document.getElementById("talk-button");
// talkButton.onclick = async () => {
//   // connectionState not supported in firefox
//   if (
//     peerConnection?.signalingState === "stable" ||
//     peerConnection?.iceConnectionState === "connected"
//   ) {
//     const talkResponse = await fetch(
//       `${process.env.DID_URL}/talks/streams/${streamId}`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Basic ${process.env.DID_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           script: {
//             type: "audio",
//             audio_url:
//               "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/webrtc.mp3",
//           },
//           driver_url: "bank://lively/",
//           config: {
//             stitch: true,
//           },
//           session_id: sessionId,
//         }),
//       }
//     );
//   }
// };

// const destroyButton = document.getElementById("destroy-button");
// destroyButton.onclick = async () => {
//   await fetch(`${process.env.DID_URL}/talks/streams/${streamId}`, {
//     method: "DELETE",
//     headers: {
//       Authorization: `Basic ${process.env.DID_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ session_id: sessionId }),
//   });

//   stopAllStreams();
//   closePC();
// };

export function onIceGatheringStateChange() {
  // iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  // iceGatheringStatusLabel.className =
  //   "iceGatheringState-" + peerConnection.iceGatheringState;
}
export function onIceCandidate(event) {
  // console.log("onIceCandidate", event);
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
export function onIceConnectionStateChange() {
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
export function onConnectionStateChange() {
  // not supported in firefox
  // peerStatusLabel.innerText = peerConnection.connectionState;
  // peerStatusLabel.className =
  //   "peerConnectionState-" + peerConnection.connectionState;
}
export function onSignalingStateChange() {
  // signalingStatusLabel.innerText = peerConnection.signalingState;
  // signalingStatusLabel.className =
  //   "signalingState-" + peerConnection.signalingState;
}
function onTrack(event) {
  const remoteStream = event.streams[0];
  setVideoElement(remoteStream);
}

// export async function createPeerConnection(offer, iceServers) {
//   if (!peerConnection) {
//     peerConnection = new RTCPeerConnection({ iceServers });
//     peerConnection.addEventListener(
//       "icegatheringstatechange",
//       onIceGatheringStateChange,
//       true
//     );
//     peerConnection.addEventListener("icecandidate", onIceCandidate, true);
//     peerConnection.addEventListener(
//       "iceconnectionstatechange",
//       onIceConnectionStateChange,
//       true
//     );
//     peerConnection.addEventListener(
//       "connectionstatechange",
//       onConnectionStateChange,
//       true
//     );
//     peerConnection.addEventListener(
//       "signalingstatechange",
//       onSignalingStateChange,
//       true
//     );
//     peerConnection.addEventListener("track", onTrack, true);
//   }

//   await peerConnection.setRemoteDescription(offer);
//   console.log("set remote sdp OK");

//   const sessionClientAnswer = await peerConnection.createAnswer();
//   console.log("create local sdp OK");

//   await peerConnection.setLocalDescription(sessionClientAnswer);
//   console.log("set local sdp OK");

//   return sessionClientAnswer;
// }

// function setVideoElement(stream) {
//   if (!stream) return;
//   talkVideo.srcObject = stream;

//   // safari hotfix
//   if (talkVideo.paused) {
//     talkVideo
//       .play()
//       .then((_) => {})
//       .catch((e) => {});
//   }
// }

// function stopAllStreams() {
//   if (talkVideo.srcObject) {
//     console.log("stopping video streams");
//     talkVideo.srcObject.getTracks().forEach((track) => track.stop());
//     talkVideo.srcObject = null;
//   }
// }

// function closePC(pc = peerConnection) {
//   if (!pc) return;
//   console.log("stopping peer connection");
//   pc.close();
//   pc.removeEventListener(
//     "icegatheringstatechange",
//     onIceGatheringStateChange,
//     true
//   );
//   pc.removeEventListener("icecandidate", onIceCandidate, true);
//   pc.removeEventListener(
//     "iceconnectionstatechange",
//     onIceConnectionStateChange,
//     true
//   );
//   pc.removeEventListener(
//     "connectionstatechange",
//     onConnectionStateChange,
//     true
//   );
//   pc.removeEventListener("signalingstatechange", onSignalingStateChange, true);
//   pc.removeEventListener("track", onTrack, true);
//   iceGatheringStatusLabel.innerText = "";
//   signalingStatusLabel.innerText = "";
//   iceStatusLabel.innerText = "";
//   peerStatusLabel.innerText = "";
//   console.log("stopped peer connection");
//   if (pc === peerConnection) {
//     peerConnection = null;
//   }
// }
