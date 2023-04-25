export default async (req, res) => {
  const { streamId, sessionId } = req.body;

  const talkResponse = await fetch(
    `${process.env.DID_URL}/talks/streams/${streamId}`,
    {
      method: "POST",
      headers: {
        // "Access-Control-Allow-Origin": true,
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        "Content-Type": "application/json",
      },
      // mode: "no-cors",
      body: JSON.stringify({
        script: {
          type: "audio",
          audio_url:
            "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/webrtc.mp3",
        },
        driver_url: "bank://lively/",
        config: {
          stitch: true,
        },
        session_id: sessionId,
      }),
    }
  );

  res.status(200).json(talkResponse);
};
