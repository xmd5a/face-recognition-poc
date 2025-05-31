import { useState, useEffect } from "react";

export const useTypewriter = (
  text: string,
  speed: number = 50,
  delay: number = 0
) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeout: number;
    let currentIndex = 0;

    const startTyping = () => {
      timeout = window.setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          window.clearInterval(timeout);
          setIsComplete(true);
        }
      }, speed);
    };

    const delayTimeout = window.setTimeout(startTyping, delay);

    return () => {
      window.clearTimeout(delayTimeout);
      window.clearInterval(timeout);
    };
  }, [text, speed, delay]);

  return { displayedText, isComplete };
};
