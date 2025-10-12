import dotenv from "dotenv";
import { fal } from "@fal-ai/client";
import cors from "cors"; // Import cors

// Load environment variables
dotenv.config();

// Configure FAL client with the key from environment variables
console.log("FAL_AI_KEY:", process.env.FAL_AI_KEY);
fal.config({
  credentials: process.env.FAL_AI_KEY,
});

const app = express();

// Enable CORS for requests from the frontend
app.use(cors({ origin: "http://localhost:9001" })); // Allow requests from the frontend's origin

app.use(express.json());

// Basic route to test the server
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

// Secure route to handle FAL requests
app.post("/handleFalRequest", async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate the request body
    if (!prompt) {
      return res.status(400).send("Missing 'prompt' in request body");
    }

    console.log("Prompt received:", prompt);

    // Run the FAL AI client
    console.log("Calling FAL API...");
    const { data } = await fal.run("fal-ai/any-llm", {
      input: {
        model: "openai/gpt-4o-mini",
        prompt,
        format: "json",
        temperature: 0.2,
      },
    });
    console.log("FAL API response:", data);

    // Normalize the response
    const raw =
      (data as any)?.output ??
      (data as any)?.output?.content ??
      (typeof data === "string" ? data : "");

    // Send the response back to the frontend
    res.status(200).json({ output: raw });
  } catch (error) {
    console.error("Error in /handleFalRequest:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});