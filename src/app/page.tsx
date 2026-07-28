import type { Metadata } from "next";
import { HomeDashboard } from "@/components/home/home-dashboard";

export const metadata: Metadata = {
  title: "Home",
};

export default function Home() {
  return <HomeDashboard />;
}
