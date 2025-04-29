import * as React from "react";

/**
 * Hook to detect and track focus state of an element
 * @returns {[React.RefObject<HTMLElement>, boolean]} A tuple with a ref to attach to the element and a boolean indicating focus state
 */
export function useFocus<T extends HTMLElement = HTMLElement>(): [
  React.MutableRefObject<T | null>,
  boolean
] {
  const ref = React.useRef<T>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    element.addEventListener("focus", handleFocus);
    element.addEventListener("blur", handleBlur);

    // Check if element is already focused
    if (document.activeElement === element) {
      setIsFocused(true);
    }

    return () => {
      element.removeEventListener("focus", handleFocus);
      element.removeEventListener("blur", handleBlur);
    };
  }, []);

  return [ref, isFocused];
}

/**
 * Hook to detect the currently focused element in the document
 * @returns The currently focused element or null if nothing is focused
 */
export function useFocusedElement(): Element | null {
  const [focusedElement, setFocusedElement] = React.useState<Element | null>(
    document.activeElement
  );

  React.useEffect(() => {
    const handleFocusChange = () => {
      setFocusedElement(document.activeElement);
    };

    // Update on focus/blur events at the document level
    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);

    return () => {
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
    };
  }, []);

  return focusedElement;
} 