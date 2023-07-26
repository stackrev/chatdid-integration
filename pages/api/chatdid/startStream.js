export default async (req, res) => {
  const { streamId, sessionClientAnswer, sessionId } = req.body;
  const sdpResponse = await fetch(
    `${process.env.DID_URL}/talks/streams/${streamId}/sdp`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answer: sessionClientAnswer,
        session_id: sessionId,
      }),
    }
  );
  res.status(200).json(sdpResponse);
};
