"use client";

import { useEffect, useState, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";

export function ThemeToggler() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const button = buttonRef.current;
    if (!button) return;

    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    const { top, left, width, height } = button.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;

    const maxRadius = Math.hypot(
      Math.max(cx, viewportWidth - cx),
      Math.max(cy, viewportHeight - cy),
    );

    const applyTheme = () => {
      const nextTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      document.documentElement.style.colorScheme = nextTheme;
      localStorage.setItem("theme", nextTheme);
      setIsDark(nextTheme === "dark");
    };

    if (typeof document.startViewTransition !== "function") {
      applyTheme();
      return;
    }

    const clipPath: [string, string] = [
      `circle(0px at ${cx}px ${cy}px)`,
      `circle(${maxRadius}px at ${cx}px ${cy}px)`,
    ];

    const root = document.documentElement;
    root.dataset.magicuiThemeVt = "active";
    root.style.setProperty("--magicui-theme-toggle-vt-duration", "400ms");
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0]);

    const cleanup = () => {
      delete root.dataset.magicuiThemeVt;
      root.style.removeProperty("--magicui-theme-toggle-vt-duration");
      root.style.removeProperty("--magicui-theme-vt-clip-from");
    };

    const transition = document.startViewTransition(() => {
      applyTheme();
    });

    if (transition?.finished) {
      void transition.finished.finally(cleanup);
    } else {
      cleanup();
    }

    const ready = transition?.ready;
    if (ready) {
      void ready.then(() => {
        document.documentElement.animate(
          {
            clipPath,
          },
          {
            duration: 400,
            easing: "ease-in-out",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="size-9 rounded-full p-0" aria-hidden="true">
        <Moon className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="size-9 rounded-full p-0"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
