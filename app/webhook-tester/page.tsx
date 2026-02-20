"use client";

import { WebhookToolForm } from "@/components/WebhookToolForm";

export default function WebhookTesterPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Webhook Tester</h1>
      <p className="text-sm text-muted-foreground">
        Send a tool_call payload to the voice webhook (create_calendar_event). Use this to test the
        backend without a voice provider.
      </p>
      <WebhookToolForm />
    </div>
  );
}
