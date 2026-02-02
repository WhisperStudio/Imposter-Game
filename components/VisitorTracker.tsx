"use client";

import { useEffect } from "react";
import { visitorsDb, collection, addDoc, serverTimestamp } from "@/firebase/visitors";

type IpApiResponse = { country?: string };

export default function VisitorTracker() {
  useEffect(() => {
    const SITE_ID = "imposter-game"; // <- navnet du vil bruke i samme visitors-collection
    const key = `visitLogged:${SITE_ID}`;

    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "true");

    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json");
        const data = (await res.json()) as IpApiResponse;

        await addDoc(collection(visitorsDb, "game-visitors"), {
          site: SITE_ID,
          country: data.country ?? null,
          path: window.location.pathname,
          hostname: window.location.hostname,
          userAgent: navigator.userAgent,
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.error("Visitor logging failed:", err);
      }
    })();
  }, []);

  return null;
}
