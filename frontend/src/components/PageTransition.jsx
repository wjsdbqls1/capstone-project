// src/components/PageTransition.jsx
import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
};

function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
