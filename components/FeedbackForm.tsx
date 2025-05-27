
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackText: string) => Promise<boolean>; 
  submissionStatus: 'idle' | 'submitting' | 'success' | 'error';
  submissionMessage: string | null;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submissionStatus,
  submissionMessage,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Reset form text when it's opened, unless it's still submitting or showing an error from a previous attempt in the same modal session
  useEffect(() => {
    if (isOpen) {
      if (submissionStatus === 'idle' || submissionStatus === 'success') { // Success would have closed it, so idle is main trigger
        setFeedbackText('');
        setLocalError(null);
      }
      // If submissionStatus is 'error', feedbackText and submissionMessage persist for user to see/retry
    }
  }, [isOpen, submissionStatus]);
  
  const handleInternalClose = () => {
    setLocalError(null); // Clear local error before calling parent onClose
    onClose();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setLocalError('กรุณาใส่ความคิดเห็นของคุณ');
      return;
    }
    setLocalError(null); // Clear local error before submitting

    const success = await onSubmit(feedbackText);
    if (success) {
      // Parent (App.tsx) handles closing the modal and showing success message
      setFeedbackText(''); // Clear text for next time modal opens
    }
    // If !success, parent handles setting submissionMessage and keeping modal open
  };

  return (
    <Modal isOpen={isOpen} onClose={handleInternalClose} title="💬 ส่งความคิดเห็นถึงเรา">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="feedbackText" className="sr-only">
            ความคิดเห็นของคุณ
          </label>
          <textarea
            id="feedbackText"
            value={feedbackText}
            onChange={(e) => {
              setFeedbackText(e.target.value);
              if (localError) setLocalError(null); // Clear local error on typing
            }}
            rows={5}
            className={`w-full p-3 bg-white dark:bg-dark-inputBg border rounded-[10px] text-neutral-dark dark:text-dark-text font-normal focus:outline-none 
                        ${localError || (submissionStatus === 'error' && submissionMessage) 
                            ? 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500/50 dark:focus:ring-red-400/50' 
                            : 'border-[#CCCCCC] dark:border-dark-border focus:border-primary dark:focus:border-dark-primary-DEFAULT focus:ring-1 focus:ring-primary/50 dark:focus:ring-dark-primary-DEFAULT/50'}`}
            placeholder="เราอยากรู้ว่าคุณคิดอย่างไร..."
            aria-describedby="feedback-form-error"
            aria-invalid={!!localError || (submissionStatus === 'error' && !!submissionMessage)}
            disabled={submissionStatus === 'submitting'}
          />
          {(localError || (submissionStatus === 'error' && submissionMessage)) && (
            <p id="feedback-form-error" className="text-red-500 dark:text-red-400 text-xs mt-1 font-normal">
              {localError /* Prioritize local validation error */ || submissionMessage}
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={submissionStatus === 'submitting'}
        >
          {submissionStatus === 'submitting' ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
        </Button>
      </form>
    </Modal>
  );
};
