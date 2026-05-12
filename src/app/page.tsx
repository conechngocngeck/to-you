"use client";

import dynamic from "next/dynamic";

const BottleScene = dynamic(() => import("@/components/BottleScene"), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <BottleScene />
    </main>
  );
}
