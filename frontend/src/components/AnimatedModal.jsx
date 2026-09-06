// src/components/AnimatedModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedModal({ isOpen, onClose, children, overlayStyle, modalStyle }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={overlayStyle}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnimatedModal;
