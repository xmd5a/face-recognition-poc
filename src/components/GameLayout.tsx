import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MatrixEffect from "./MatrixEffect";

interface GameLayoutProps {
  children: ReactNode;
  isCompiling: boolean;
}

const GameLayout = ({ children, isCompiling }: GameLayoutProps) => {
  return (
    <div className="relative min-h-screen bg-[#1A1A1A] text-green-500 font-mono overflow-hidden">
      {/* CRT Overlay */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Scanlines */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/15 animate-scanline" />
        {/* Screen flicker */}
        <div className="absolute inset-0 bg-white/[0.007] animate-flicker" />
        {/* CRT curvature */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/20" />
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-6 py-8 h-screen flex flex-col">
        {/* Game Area (70%) */}
        <div className="h-[70%] mb-6">
          <div className="h-full bg-black/20 rounded-lg border border-green-500/10 shadow-lg backdrop-blur-sm">
            {children}
          </div>
        </div>

        {/* Terminal (30%) */}
        <div className="h-[30%] bg-black/30 rounded-lg border border-green-500/20 shadow-lg backdrop-blur-sm relative overflow-hidden">
          {/* Matrix Effect */}
          <MatrixEffect isActive={isCompiling} />

          {/* Terminal Content */}
          <div className="relative z-10 h-full p-6 overflow-auto terminal-text">
            <AnimatePresence mode="wait">
              {isCompiling ? (
                <motion.div
                  key="compiling"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2 text-green-400"
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-3 bg-green-500 rounded-full animate-pulse" />
                    <span>Initializing compilation process...</span>
                  </div>
                  <div className="pl-7">Analyzing block sequence...</div>
                  <div className="pl-7">Validating dependencies...</div>
                  <div className="pl-7">Compiling code blocks...</div>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center text-green-400/70"
                >
                  <div className="w-4 h-4 mr-3 bg-green-500/50 rounded-full" />
                  <span>Ready for compilation...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLayout;
