import { useMediaQuery } from "@react-hookz/web";
import { useMemo } from "react";

// Breakpoint prefix	Minimum width	CSS
// sm	640px	@media (min-width: 640px) { ... }
// md	768px	@media (min-width: 768px) { ... }
// lg	1024px	@media (min-width: 1024px) { ... }
// xl	1280px	@media (min-width: 1280px) { ... }
// 2xl	1536px	@media (min-width: 1536px) { ... }

type MinScreen = "sm" | "md" | "lg" | "xl" | "2xl";

export default function useMinimumWidth(minScreen: MinScreen) {
  const media = useMemo(() => {
    switch (minScreen) {
      case "sm":
        return 640;
      case "md":
        return 768;
      case "lg":
        return 1024;
      case "xl":
        return 1280;
      case "2xl":
        return 1536;
      default:
        return 0;
    }
  }, [minScreen]);

  const isMatchingMedia = useMediaQuery(`(min-width: ${media}px)`, { initializeWithValue: true });
  return isMatchingMedia;
}
