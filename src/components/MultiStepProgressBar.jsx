import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const MultiStepProgressBar = ({ steps, currentStep }) => {
  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const stepIndex = index + 1;
          const isActive = stepIndex === currentStep;
          const isCompleted = stepIndex < currentStep;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all duration-300',
                    isCompleted ? 'bg-secondary border-secondary text-white' : '',
                    isActive ? 'bg-white border-primary text-primary shadow-[0_0_0_4px_rgba(0,102,255,0.2)]' : '',
                    !isCompleted && !isActive ? 'bg-neutral-10 border-neutral-30 text-neutral-70' : ''
                  )}
                  animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : stepIndex}
                </motion.div>
                <p className={cn('mt-2 text-xs font-semibold w-20', isActive || isCompleted ? 'text-neutral-100' : 'text-neutral-70')}>
                  {step}
                </p>
              </div>

              {stepIndex < steps.length && (
                <div className="flex-1 h-1 mx-2 bg-neutral-30 rounded-full overflow-hidden relative">
                    <motion.div 
                        className="h-full absolute left-0 top-0 bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: '0%' }}
                        animate={{ width: isCompleted ? '100%' : '0%' }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                    {isActive && stepIndex > 1 &&
                      <motion.div 
                          className="h-full absolute right-0 top-0 bg-gradient-to-l from-primary to-secondary"
                          initial={{ width: '100%' }}
                          animate={{ width: '0%' }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                      />
                    }
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default MultiStepProgressBar;