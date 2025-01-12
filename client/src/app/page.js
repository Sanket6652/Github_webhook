import Image from "next/image";
import AnalyticsCards from "../component/AnalyticsCards";
import WebhookEventsList from "../component/WebhookEventsList";
export default function Home() {
  return (
    <div className="flex flex-col justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1>GitHub Webhook Dashboard</h1>

      <WebhookEventsList />
      <AnalyticsCards />
    </div>
  );
}
