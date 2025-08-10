// src/lib/testFal.ts
import { fal } from "@fal-ai/client";

// Use exactly ONE string credential.
// Either your fal_live_... key OR "<KEY_ID>:<SECRET>"
fal.config({
  credentials: "1944d3d5-e4ee-4e3f-bc99-3ff9b5661887:61bb8745eb3053d86ef3b61ba09a51e0", // ← replace with your key OR "id:secret"
});

async function main() {
  try {
    const { data } = await fal.run("fal-ai/any-llm", {
      input: {
        model: "openai/gpt-4o-mini", // vendor-prefixed model name
        prompt: "Say pong",
        format: "text",              // or "json"
      },
    });

    const output = (data as any)?.output ?? (data as any)?.output?.content;
    console.log("OK ✅");
    console.log("Model:", (data as any)?.model);
    console.log("Output:", output);
  } catch (e: any) {
    console.error("FAL error:", e?.status || e?.code || e);
    if (e?.body) console.error("Detail:", JSON.stringify(e.body, null, 2));
  }
}

main();
