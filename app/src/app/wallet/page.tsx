"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Wallet() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code");

  useEffect(() => {
    (async () => {
      if (!code) {
        return;
      }
      const { access_token } = await fetch("http://localhost:3000/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      }).then((res) => res.json());
      console.log("access_token", access_token);
      if (!access_token) {
        return;
      }
      const { credential } = await fetch("http://localhost:3000/credential", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token }),
      }).then((res) => res.json());
      console.log("credential", credential);
    })();
  }, [code]);

  return (
    <main>
      {!code && (
        <button
          onClick={() => {
            router.push("/authorize");
          }}
        >
          Authorize with Lens
        </button>
      )}
    </main>
  );
}
