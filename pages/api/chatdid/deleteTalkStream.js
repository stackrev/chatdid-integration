export default async (req, res) => {
  const { streamId, sessionId } = req.body;
  const response = await fetch(
    `${process.env.DID_URL}/talks/streams/${streamId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ session_id: sessionId }),
    }
  );

  res.status(200).json(response);
};
