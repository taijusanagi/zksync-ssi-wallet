"use client";

import { useRouter } from "next/navigation";

//TODO: integrate Lens
export default function AuthorizePage() {
  const router = useRouter();

  return (
    <main>
      <button
        onClick={() => {
          const redirect_uri = "http://localhost:3000/wallet";
          router.push(`/approve?redirect_uri=${redirect_uri}`);
        }}
      >
        Authorize
      </button>
    </main>
  );
}
