"use client";

import type { Icon } from "@phosphor-icons/react";
import { CircleHalfTiltIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/ssr";
import { type FC, useCallback, useEffect, useState } from "react";
import z from "zod";
import { cn } from "@/lib/cn/index.ts";

type ThemeValue = "light" | "dark" | undefined;

const themeSchema = z.enum([
  "light",
  "dark",
]);

type ToggleProps = {
  icon: Icon;
  isSelected: boolean;
  onClick: () => void;
};

const Toggle: FC<ToggleProps> = ({ icon: ToggleIcon, onClick, isSelected }) => (
  <button
    className={cn(
      "cursor-pointer p-1",
      isSelected
        ? "text-white bg-black dark:bg-zinc-600"
        : "text-black dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-500",
    )}
    onClick={onClick}
    type="button"
  >
    <ToggleIcon className="size-5" weight="regular" />
  </button>
);

const getStoredTheme = (): ThemeValue => {
  const result = themeSchema.safeParse(localStorage.getItem("theme"));

  if (result.success) {
    return result.data;
  }

  localStorage.removeItem("theme");
};

export const ThemeToggles = () => {
  const [activeTheme, setActiveTheme] = useState<ThemeValue>(undefined);

  useEffect(() => {
    setActiveTheme(getStoredTheme());
  }, []);

  const handleThemeChange = useCallback((wants: ThemeValue) => {
    if (wants === undefined) {
      localStorage.removeItem("theme");
    } else {
      localStorage.theme = wants;
    }

    setActiveTheme(wants);

    document.documentElement.classList.toggle(
      "dark",
      localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          globalThis.matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }, []);
  const onWantsLightTheme = useCallback(
    () => handleThemeChange("light"),
    [
      handleThemeChange,
    ],
  );
  const onWantsDarkTheme = useCallback(
    () => handleThemeChange("dark"),
    [
      handleThemeChange,
    ],
  );
  const onWantsSystemTheme = useCallback(
    () => handleThemeChange(undefined),
    [
      handleThemeChange,
    ],
  );

  return (
    <div className="flex items-start">
      <Toggle icon={SunIcon} isSelected={activeTheme === "light"} onClick={onWantsLightTheme} />
      <Toggle icon={MoonIcon} isSelected={activeTheme === "dark"} onClick={onWantsDarkTheme} />
      <Toggle
        icon={CircleHalfTiltIcon}
        isSelected={activeTheme === undefined}
        onClick={onWantsSystemTheme}
      />
    </div>
  );
};
