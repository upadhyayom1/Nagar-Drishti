'use client';

import { useState, useEffect } from 'react';

interface TypewriterWord {
  text: string;
  gradientClass: string;
}

interface TypewriterTextProps {
  words: TypewriterWord[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export function TypewriterText({
  words,
  typingSpeed = 75,
  deletingSpeed = 40,
  pauseDuration = 2200,
  className = '',
}: TypewriterTextProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex]?.text || '';

    let timer: NodeJS.Timeout;

    if (!isDeleting && currentText === currentWord) {
      // Pause at full word before deleting
      timer = setTimeout(() => setIsDeleting(true), pauseDuration);
    } else if (isDeleting && currentText === '') {
      // Move to next word and start typing
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    } else {
      // Typing or deleting next character
      const speed = isDeleting ? deletingSpeed : typingSpeed;
      timer = setTimeout(() => {
        const nextLength = isDeleting ? currentText.length - 1 : currentText.length + 1;
        setCurrentText(currentWord.slice(0, nextLength));
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  const activeGradient = words[wordIndex]?.gradientClass || 'from-[#00f59b] via-cyan-400 to-teal-300';

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span
        className={`bg-gradient-to-r ${activeGradient} bg-clip-text text-transparent font-extrabold transition-all duration-300`}
      >
        {currentText}
      </span>
      {/* Animated Typing Terminal Cursor */}
      <span
        aria-hidden="true"
        className="inline-block w-[3px] h-[0.85em] ml-1 bg-[var(--brand-teal)] align-middle animate-[pulse_0.8s_infinite] shadow-[0_0_10px_var(--brand-teal)]"
      />
    </span>
  );
}
