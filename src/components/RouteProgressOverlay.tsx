"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppLoading } from "./AppLoading";

const MIN_VISIBLE_DURATION = 300;
const MAX_VISIBLE_DURATION = 10000;

export function RouteProgressOverlay() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingNavigationRef = useRef(false);
  const lastPathnameRef = useRef(pathname);

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return; // only left click
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;

        const destinationPath = url.pathname + url.search + url.hash;
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        if (destinationPath === currentPath) return;

        startNavigation();
      } catch {
        // ignore invalid URL
      }
    };

    document.addEventListener("click", handleLinkClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!pendingNavigationRef.current) {
      lastPathnameRef.current = pathname;
      return;
    }

    if (lastPathnameRef.current !== pathname) {
      completeNavigation();
      lastPathnameRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, []);

  const startNavigation = () => {
    pendingNavigationRef.current = true;
    startTimeRef.current = Date.now();
    setIsVisible(true);

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);

    maxTimeoutRef.current = setTimeout(() => {
      pendingNavigationRef.current = false;
      startTimeRef.current = null;
      setIsVisible(false);
    }, MAX_VISIBLE_DURATION);
  };

  const completeNavigation = () => {
    if (!startTimeRef.current) {
      reset();
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(MIN_VISIBLE_DURATION - elapsed, 0);

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);

    hideTimeoutRef.current = setTimeout(() => {
      reset();
    }, remaining);
  };

  const reset = () => {
    pendingNavigationRef.current = false;
    startTimeRef.current = null;
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return <AppLoading />;
}
