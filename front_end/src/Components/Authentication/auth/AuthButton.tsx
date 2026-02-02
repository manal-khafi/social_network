import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader } from "./Loader";

type AuthButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
  children: ReactNode;
};

export const AuthButton = ({
  variant = "primary",
  isLoading = false,
  children,
  disabled,
  ...props
}: AuthButtonProps) => {
  const isPrimary = variant === "primary";
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`w-full py-3 px-6 rounded-xl transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
        isPrimary
          ? "bg-[#d6955b] text-white hover:bg-[#c8864d] hover:shadow-lg hover:shadow-[#d6955b]/30"
          : "bg-[#18534f] text-white hover:bg-[#226d68] hover:shadow-lg hover:shadow-[#18534f]/30"
      }`}
      disabled={disabled || isLoading}
      {...props}
    >
      <motion.div
        className="flex items-center justify-center gap-2"
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader />
        </motion.div>
      )}
    </motion.button>
  );
};
