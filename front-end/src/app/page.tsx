import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Tokens from "@/components/Tokens";
import Flywheel from "@/components/Flywheel";
import Roadmap from "@/components/Roadmap";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Flywheel />
      <Tokens />
      <Roadmap />
      <CTA />
    </>
  );
}
