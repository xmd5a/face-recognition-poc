import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTypewriter } from "../hooks/useTypewriter";

interface MatrixEffectProps {
  isActive: boolean;
}

const MatrixEffect = ({ isActive }: MatrixEffectProps) => {
  const [characters, setCharacters] = useState<string[][]>([]);
  const [dimensions, setDimensions] = useState({ columns: 0, rows: 0 });

  useEffect(() => {
    if (!isActive) return;

    const updateDimensions = () => {
      const charWidth = 20;
      const charHeight = 20;
      const columns = Math.floor(window.innerWidth / charWidth);
      const rows = Math.floor(window.innerHeight / charHeight);
      setDimensions({ columns, rows });

      const chars = "01アイウエオカキクケコサシスセソタチツテト";
      const newChars = Array.from({ length: rows }, () =>
        Array.from(
          { length: columns },
          () => chars[Math.floor(Math.random() * chars.length)]
        )
      );
      setCharacters(newChars);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    const interval = setInterval(() => {
      setCharacters((prev) =>
        prev.map((row) =>
          row.map(() => {
            const chars = "01アイウエオカキクケコサシスセソタチツテト";
            return chars[Math.floor(Math.random() * chars.length)];
          })
        )
      );
    }, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateDimensions);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-40 bg-black/90">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${dimensions.columns}, 1fr)`,
          fontSize: "14px",
          lineHeight: "1",
        }}
      >
        {characters.map((row, i) =>
          row.map((char, j) => (
            <motion.div
              key={`${i}-${j}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: (i + j) * 0.01 }}
              className="text-terminal-green opacity-30"
            >
              {char}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const CompilationStep = ({
  text,
  show = true,
}: {
  text: string;
  show?: boolean;
}) => {
  const { displayedText } = useTypewriter(text, 30, 0);
  if (!show) return null;
  return <div className="pl-6 opacity-70">{displayedText}</div>;
};

interface TerminalProps {
  isCompiling: boolean;
  errors: string[];
  onReset: () => void;
  onCompile: () => void;
}

const Terminal = ({
  isCompiling,
  errors,
  onReset,
  onCompile,
}: TerminalProps) => {
  const [step, setStep] = useState(0);
  const [hasCompilationAttempted, setHasCompilationAttempted] = useState(false);
  const { displayedText: initText } = useTypewriter(
    "Initializing compilation process...",
    30,
    0
  );

  useEffect(() => {
    if (isCompiling) {
      setHasCompilationAttempted(true);
      setStep(0);
      const timeouts = [
        setTimeout(() => setStep(1), 1000),
        setTimeout(() => setStep(2), 2000),
        setTimeout(() => setStep(3), 3000),
      ];
      return () => timeouts.forEach(clearTimeout);
    } else {
      setStep(0);
    }
  }, [isCompiling]);

  const handleTryAgain = () => {
    onReset();
    setHasCompilationAttempted(false);
  };

  return (
    <>
      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .cursor-blink {
            animation: blink 1s step-end infinite;
          }
        `}
      </style>
      <div className="relative h-full bg-black/30 rounded-lg border border-terminal-green/20 overflow-hidden">
        <MatrixEffect isActive={isCompiling} />

        <div className="relative z-50 p-4">
          {isCompiling ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-terminal-green rounded-full animate-pulse mr-3" />
                <span className="terminal-text">{initText}</span>
              </div>
              <CompilationStep
                text="Analyzing block sequence..."
                show={step >= 1}
              />
              <CompilationStep
                text="Validating dependencies..."
                show={step >= 2}
              />
              <CompilationStep text="Running compilation..." show={step >= 3} />
            </div>
          ) : errors.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3" />
                <span className="text-red-400">
                  Compilation failed: {errors.length} error
                  {errors.length !== 1 ? "s" : ""}
                </span>
              </div>
              {errors.map((error, index) => (
                <div key={index} className="pl-6 text-red-400 opacity-90">
                  {error}
                </div>
              ))}
            </div>
          ) : !isCompiling && errors.length === 0 && hasCompilationAttempted ? (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
              <span className="text-green-400">Compilation Successful!</span>
            </div>
          ) : (
            <div className="flex items-center font-mono">
              <span className="text-terminal-green">adamx@PC:</span>
              <span className="text-blue-400">~</span>
              <span className="text-terminal-green">$</span>
              <span className="ml-2 w-2 h-4 bg-white cursor-blink inline-block"></span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Terminal;
