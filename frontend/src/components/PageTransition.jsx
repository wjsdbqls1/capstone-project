// src/components/PageTransition.jsx
import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      style={{ height: '100%', width: '100%' }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
