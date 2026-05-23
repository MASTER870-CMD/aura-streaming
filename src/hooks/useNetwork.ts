"use client";

import { useEffect, useState } from "react";

interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useNetwork(): NetworkState {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const initialOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    setIsOnline(initialOnline);
    setWasOffline(!initialOnline);

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

