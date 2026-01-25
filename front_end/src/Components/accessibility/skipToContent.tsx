import { useAppSelector } from "../../hooks";

export function SkipToContent() {
  const { screenReader } = useAppSelector((state) => state.accessibility);

  if (!screenReader) {
    return null;
  }

  return (
    <a href="#main-content" className="a11y-skip-link">
      Skip to content
    </a>
  );
}
