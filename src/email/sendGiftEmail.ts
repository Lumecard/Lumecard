/** Where the Lumecard backend runs. Locally that is `npm start` in the backend folder. */
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8787").replace(/\/$/, "");

/** Emails the recipient their claim link. Throws if it could not be sent. */
export async function sendGiftEmail(input: { to: string; claimUrl: string; senderName?: string; message?: string }): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/send-gift-email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Could not send the email");
}
