import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MatrixEffect from "./MatrixEffect";

interface GameLayoutProps {
  children: ReactNode;
  isCompiling: boolean;
}

const GameLayout = ({ children, isCompiling }: GameLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-green-500 font-mono relative overflow-hidden">
      {/* CRT Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-black opacity-15 animate-scanline" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 h-screen flex flex-col">
        {/* Game Area (70%) */}
        <div className="h-[70%] mb-4">{children}</div>

        {/* Terminal (30%) */}
        <div className="h-[30%] bg-black/50 rounded-lg p-4 border border-green-500/30 relative">
          <MatrixEffect isActive={isCompiling} />
          <div className="h-full overflow-auto terminal-text relative z-10">
            <AnimatePresence mode="wait">
              {isCompiling ? (
                <motion.div
                  key="compiling"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-green-400 font-mono"
                >
                  <div className="mb-2">
                    Initializing compilation process...
                  </div>
                  <div className="mb-2">Analyzing block sequence...</div>
                  <div className="mb-2">Validating dependencies...</div>
                  <div>Compiling code blocks...</div>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-green-400"
                >
                  Ready for compilation...
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
