import { sendResponse } from "next/dist/server/image-optimizer";

export default async (req, res) => {
  const { source_url } = req.body;
  try {
    const sessionResponse = await fetch(
      `${process.env.DID_URL}/talks/streams`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_url,
        }),
      }
    );
    // const response = await sessionResponse.json();
    // console.log(response);
    res.status(201).send(await sessionResponse.json());
  } catch (error) {
    console.log(error);
    res.status(404).send();
  }
};
