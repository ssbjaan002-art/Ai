import { useState, useEffect, useRef } from "react";

interface TypewriterTextProps {
  text: string;
  delay?: number;
  onComplete?: () => void;
}

export default function TypewriterText({ text, delay = 10, onComplete }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const currentIndexRef = useRef(0);
  const textRef = useRef(text);

  // Update ref when text prop changes
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    setDisplayedText("");
    currentIndexRef.current = 0;

    let timerId: NodeJS.Timeout;

    const tick = () => {
      const fullText = textRef.current;
      if (currentIndexRef.current < fullText.length) {
        // Speed scaling: print faster if the message is long to avoid user frustration
        const remaining = fullText.length - currentIndexRef.current;
        let chunkSize = 1;
        
        if (fullText.length > 500) {
          chunkSize = remaining > 10 ? 4 : 1;
        } else if (fullText.length > 200) {
          chunkSize = remaining > 5 ? 2 : 1;
        }

        const nextIndex = Math.min(currentIndexRef.current + chunkSize, fullText.length);
        const nextText = fullText.slice(0, nextIndex);
        setDisplayedText(nextText);
        currentIndexRef.current = nextIndex;

        timerId = setTimeout(tick, delay);
      } else {
        if (onComplete) {
          onComplete();
        }
      }
    };

    timerId = setTimeout(tick, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [text, delay, onComplete]);

  // Handle manual skip on clicking the text
  const handleSkip = () => {
    if (currentIndexRef.current < text.length) {
      currentIndexRef.current = text.length;
      setDisplayedText(text);
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <span 
      className="font-sans break-words whitespace-pre-wrap cursor-pointer select-text" 
      onClick={handleSkip}
      title="Click to instantly reveal full text"
    >
      {displayedText}
      {currentIndexRef.current < text.length && (
        <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-0.5 animate-pulse" />
      )}
    </span>
  );
}
