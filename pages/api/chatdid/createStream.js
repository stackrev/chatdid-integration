export default async (req, res) => {
  const { streamId, sessionId, inputText } = req.body;
  console.log("inputText", inputText);

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
          input: inputText,
          type: "text",
          provider: { type: "microsoft", voice_id: "en-ZA-LeahNeural" },
          ssml: "false",
        },
        driver_url: "bank://lively/",
        config: {
          stitch: true,
        },
        session_id: sessionId,
      }),
    }
  );
  const response = await talkResponse.json();
  res.status(200).json(response);
};
