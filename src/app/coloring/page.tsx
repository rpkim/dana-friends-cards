import type { Metadata } from "next";
import { ColoringGallery } from "./ColoringGallery";

export const metadata: Metadata = {
  title: "Dana & Friends Coloring",
  description:
    "Easy Dana & Friends coloring pages for kids. Download or print a page.",
};

export default function ColoringPage() {
  return <ColoringGallery />;
}
