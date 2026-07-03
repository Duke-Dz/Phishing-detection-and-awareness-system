import { motion, useReducedMotion } from "framer-motion";

export const PageTransition = ({ children }) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.995 }}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="min-h-[100dvh]"
    >
      {children}
    </motion.div>
  );
};
