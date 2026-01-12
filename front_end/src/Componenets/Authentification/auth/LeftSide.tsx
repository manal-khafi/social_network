import { motion } from "framer-motion";
import { Users, MessageCircle, Heart, Share2 } from "lucide-react";

export function LeftSide() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#18534F] to-[#718197] flex items-center justify-center p-12">
      {/* Decorative floating elements */}
      <motion.div
        className="absolute top-20 left-16 w-32 h-32 rounded-full bg-[#FEEAA1] opacity-10"
        animate={{
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-32 right-24 w-24 h-24 rounded-full bg-[#D6955B] opacity-20"
        animate={{
          y: [0, -15, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute top-1/3 right-12 w-16 h-16 rounded-full bg-[#FEEAA1] opacity-15"
        animate={{
          y: [0, 25, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-xl text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          className="mb-12 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Users className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl font-bold text-white mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Welcome to the
          <br />
          <span className="text-[#FEEAA1]">Social World</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-lg text-white/80 mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Connect with friends, share moments, and discover communities that inspire you. Your journey to meaningful connections starts here.
        </motion.p>

        {/* Social Icons with Connection Lines */}
        <motion.div
          className="flex items-center justify-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <MessageCircle className="w-6 h-6 text-[#FEEAA1]" />
            </div>
            {/* Connection line */}
            <div className="absolute top-1/2 left-full w-8 h-0.5 bg-white/20 -translate-y-1/2" />
          </motion.div>

          <motion.div
            className="relative"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Heart className="w-6 h-6 text-[#D6955B]" />
            </div>
            {/* Connection line */}
            <div className="absolute top-1/2 left-full w-8 h-0.5 bg-white/20 -translate-y-1/2" />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Share2 className="w-6 h-6 text-[#FEEAA1]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Footer text */}
        <motion.p
          className="mt-16 text-sm text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Join thousands already connected
        </motion.p>

        {/* Decorative online dots */}
        <motion.div
          className="mt-6 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-[#FEEAA1]"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-[#D6955B]"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-white"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
