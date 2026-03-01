import { ReactNode } from "react";
import { motion } from "framer-motion";

export default function PageTransition({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="route-enter"
    >
      {children}
    </motion.div>
  );
}
