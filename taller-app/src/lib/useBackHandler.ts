"use client";

import { useEffect, useRef, useCallback } from "react";

type BackAction = () => void | boolean | Promise<void | boolean>;

export function useBackHandler(action: BackAction, enabled: boolean = true) {
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: PopStateEvent) => {
      e.preventDefault();
      const result = actionRef.current();
      if (result !== false) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handler);

    return () => {
      window.removeEventListener("popstate", handler);
    };
  }, [enabled]);
}

export function useExitConfirmation(message: string = "¿Seguro que querés salir de la aplicación?") {
  const handleMessage = useCallback(
    (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    },
    [message]
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleMessage);
    return () => window.removeEventListener("beforeunload", handleMessage);
  }, [handleMessage]);
}
