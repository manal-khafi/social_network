import React from "react";
import { motion } from "framer-motion";
import { LogoIcon } from "../../ui/LogoIcon";

export const Logo: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex items-center justify-center gap-2 mb-2"
    >
      {/* Logo icon - stylized network nodes */}
      <LogoIcon />
      
      <h1 className="text-4xl text-[#18534f]">
        ANMOUGAR
      </h1>
    </motion.div>
  );
};
