"use client";

import dynamic from "next/dynamic";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";
import ControlPanel from "@/components/map/ControlPanel";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileButton from "@/components/profile/ProfileButton";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import ChatPanel from "@/components/chat/ChatPanel";
import MessagingCenter from "@/components/chat/MessagingCenter";

const MapWrapper = dynamic(() => import("@/components/map/MapWrapper"), {
  ssr: false,
  loading: () => <div className="w-screen h-screen bg-background" />,
});

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <MapWrapper />
      <OnboardingOverlay />
      <ControlPanel />
      <ChatPanel />
      <MessagingCenter />
      <ProfileCard />
      <ProfileButton />
      <LoadingOverlay />
    </main>
  );
}

