import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingScreen = ({ loading, message = "Loading your workspace..." }) => {
  // Prevent scrolling when loading is active
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [loading]);

  // Premium cubic-bezier easing matching Notion/Linear interface animations
  const easeCurve = [0.4, 0.0, 0.2, 1.0];

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: easeCurve }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          {/* Modern dot pattern grid background overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.2px,transparent_1.2px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

          {/* Centered loader arena wrapper */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.55, ease: easeCurve }}
            className="relative flex flex-col items-center justify-center select-none"
          >
            {/* HTML5 video loading animation */}
            <div className="w-44 h-44 mb-4 flex items-center justify-center rounded-2xl overflow-hidden">
              <video
                src="/loading_image.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>

            {/* Optional Loading Message & Progress Line */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5, ease: easeCurve }}
                className="mt-6 flex flex-col items-center"
              >
                <p className="text-slate-500 font-semibold tracking-[0.15em] text-xs uppercase font-sans">
                  {message}
                </p>
                {/* Premium active progress bar */}
                <div className="w-28 h-[2px] bg-slate-100 rounded-full mt-3.5 overflow-hidden">
                  <motion.div
                    animate={{
                      x: [-112, 112]
                    }}
                    transition={{
                      duration: 1.6,
                      ease: "easeInOut",
                      repeat: Infinity
                    }}
                    className="w-full h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
