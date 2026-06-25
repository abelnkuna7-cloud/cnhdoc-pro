import { createFileRoute } from "@tanstack/react-router";

// PayFast ITN (Instant Transaction Notification) webhook.
// Currently logs the payload; flip subscription status by signing in to
// Firebase Admin SDK or extending this route with a verification step.

export const Route = createFileRoute("/api/public/payfast-itn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const text = await request.text();
          console.log("[PayFast ITN]", text.slice(0, 2000));
          // TODO: verify signature against PAYFAST_PASSPHRASE and update Firestore via
          // firebase-admin once that path is needed.
          return new Response("OK");
        } catch (e) {
          console.error("ITN error", e);
          return new Response("ERR", { status: 500 });
        }
      },
    },
  },
});
