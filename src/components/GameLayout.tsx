import { type ReactNode } from "react";

interface GameLayoutProps {
  children: ReactNode;
  isCompiling: boolean;
}

const GameLayout = ({ children }: GameLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-terminal-green font-mono relative overflow-hidden">
      {/* CRT effect overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-radial from-black/50 to-black/10" />

      {/* Scanlines effect */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,#000_50%,transparent_50%)] bg-[length:100%_4px] opacity-15 animate-scanline" />

      {/* Main content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GameLayout;
