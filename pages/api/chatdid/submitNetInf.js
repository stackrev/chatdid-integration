export default async (req, res) => {
  const { streamId, candidate, sdpMid, sdpMLineIndex, sessionId } = req.body;
  const response = fetch(
    `${process.env.DID_URL}/talks/streams/${streamId}/ice`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    }
  );
  res.status(200).json(response);
};
