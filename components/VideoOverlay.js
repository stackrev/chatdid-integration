import React, { useEffect, useRef } from 'react';

const VideoOverlay = ({ videoSrc, onVideoEnd }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onended = () => {
        if (onVideoEnd) onVideoEnd();
      };
    }
  }, [videoRef, onVideoEnd]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        className="rounded-md shadow-md max-w-full max-h-full"
      ></video>
    </div>
  );
};

export default VideoOverlay;