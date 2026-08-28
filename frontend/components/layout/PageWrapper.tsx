'use client';

import { motion, type Variants } from 'framer-motion';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.985,
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  },
};

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
