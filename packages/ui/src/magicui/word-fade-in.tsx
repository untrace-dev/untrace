'use client';

import { cn } from '@untrace/ui/lib/utils';
import { motion, type Variants } from 'motion/react';

interface WordFadeInProps {
  words: string;
  className?: string;
  delay?: number;
  variants?: Variants;
}

export function WordFadeIn({
  words,
  delay = 0.15,
  variants = {
    hidden: { opacity: 0 },
    visible: (i) => ({
      opacity: 1,
      transition: { delay: i * delay },
      y: 0,
    }),
  },
  className,
}: WordFadeInProps) {
  const _words = words.split(' ');

  return (
    <motion.h1
      className={cn(
        'font-display text-center text-4xl font-bold tracking-[-0.02em] text-black drop-shadow-xs dark:text-white md:text-7xl md:leading-[5rem]',
        className,
      )}
      initial="hidden"
      variants={variants}
      whileInView={'visible'}
    >
      {_words.map((word, i) => (
        <motion.span
          custom={i}
          key={`word-${
            // biome-ignore lint/suspicious/noArrayIndexKey: index is stable for word positions
            i
          }`}
          variants={variants}
        >
          {word}{' '}
        </motion.span>
      ))}
    </motion.h1>
  );
}
