import type { Metadata } from "next";
import { PlayScreen } from "./PlayScreen";

export const metadata: Metadata = {
  title: "Dana & Friends",
  description: "Fullscreen play of the cards saved in this browser.",
};

export default function PlayPage() {
  return <PlayScreen />;
}
