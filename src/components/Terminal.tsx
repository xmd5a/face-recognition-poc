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
  currentBlocksCount: number;
  maxBlocks: number;
}

const Terminal = ({
  isCompiling,
  errors,
  onReset,
  onCompile,
  currentBlocksCount,
  maxBlocks,
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

  const allBlocksPlaced = currentBlocksCount === maxBlocks;

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
          @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(49, 196, 141, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(49, 196, 141, 0); }
            100% { box-shadow: 0 0 0 0 rgba(49, 196, 141, 0); }
          }
          .button-pulse-green {
            animation: pulse-green 2s infinite;
          }
        `}
      </style>
      <div className="relative h-full bg-black/30 rounded-lg border border-terminal-green/20 overflow-hidden flex flex-col">
        <MatrixEffect isActive={isCompiling} />

        <div className="relative z-50 p-4 flex-grow flex flex-col justify-between">
          <div>
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
                <CompilationStep
                  text="Running compilation..."
                  show={step >= 3}
                />
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
            ) : !isCompiling &&
              errors.length === 0 &&
              hasCompilationAttempted ? (
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

          <div className="mt-auto pt-4 font-mono">
            {!isCompiling && (
              <button
                onClick={onCompile}
                disabled={!allBlocksPlaced || isCompiling}
                className={`px-4 py-2 rounded text-sm flex items-center justify-center transition-all
                  ${
                    !allBlocksPlaced || isCompiling
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-60"
                      : "bg-terminal-green text-white font-semibold border border-green-600 bg-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 button-pulse-green"
                  }
                `}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 mr-2"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                </svg>
                compile
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Terminal;
