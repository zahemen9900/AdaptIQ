import React from 'react';
import './ConfirmationModal.css';
import { motion, AnimatePresence } from 'framer-motion';
import { IconAlertCircle, IconX } from '@tabler/icons-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, subMessage }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="confirmation-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">
                <IconAlertCircle size={24} />
                <h2>{title}</h2>
              </div>
              <button className="modal-close" onClick={onClose}>
                <IconX size={20} />
              </button>
            </div>

            <div className="modal-content">
              <p className="modal-message">{message}</p>
              {subMessage && <p className="modal-submessage">{subMessage}</p>}
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={onClose}>Cancel</button>
              <button className="modal-btn confirm-btn" onClick={onConfirm}>Proceed</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;