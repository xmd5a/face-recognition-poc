import { useEffect, useState, useRef } from "react";
// import { motion } from "framer-motion"; // No longer needed for MatrixEffect
// import { useTypewriter } from "../hooks/useTypewriter"; // No longer needed for initText or CompilationStep

// MatrixEffect component is no longer used and can be removed or commented out.
/*
const MatrixEffect = ({ isActive }: MatrixEffectProps) => { ... };
*/

// CompilationStep component is no longer used and can be removed or commented out.
/*
const CompilationStep = ({ text, show = true }: ...) => { ... };
*/

interface TerminalProps {
  isCompiling: boolean;
  errors: string[];
  onReset: () => void;
  onCompile: () => void;
  currentBlocksCount: number;
  maxBlocks: number;
  canCompileAfterAttempt: boolean;
}

const Terminal = ({
  isCompiling,
  errors,
  onReset,
  onCompile,
  currentBlocksCount,
  maxBlocks,
  canCompileAfterAttempt,
}: TerminalProps) => {
  // const [step, setStep] = useState(0); // No longer needed for sequential compilation messages
  const [hasCompilationAttempted, setHasCompilationAttempted] = useState(false);
  // const { displayedText: initText } = useTypewriter(...) // No longer needed

  const [typedCommand, setTypedCommand] = useState("");
  const [typedCode, setTypedCode] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [showPostErrorPrompt, setShowPostErrorPrompt] = useState(false);
  const scrollableContainerRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  const commandToType = "rrun compilation.exe --source=latest ";
  const mockCode = `
[INFO] Initializing Advanced Heuristic Analysis Engine...
[INFO] Accessing secure block chain ledger for validation protocols...
[OKAY] Ledger integrity verified. Hash: 0x5A2B9F7CD10E83A4B5C6D7E8F90A1B2C
[INFO] Loading Cognitive Dissonance Filters...
[INFO] Calibrating Neural Network Matrix for pattern recognition...
[PARAM] Iteration depth: 512, Epsilon decay: 0.998
[INFO] Analyzing block sequence: ID_PREPROCESS -> ID_FEATURE_EXTRACT -> ID_MODEL_LOAD -> ID_INFERENCE -> ID_POSTPROCESS
[DEBUG] Block ID_PREPROCESS: Applying normalization filters (Gaussian, Median, Bilateral).
[DEBUG] Memory usage: 256.78MB / 2048.00MB
[DEBUG] Block ID_FEATURE_EXTRACT: Executing SIFT, SURF, ORB descriptors.
[DEBUG] Keypoints found: 12578, Descriptors matched: 8092
[INFO] Cross-referencing with knowledge base...
[WARN] Potential anomaly detected in data stream. Confidence: 0.67. Applying corrective measures.
[DEBUG] Block ID_MODEL_LOAD: Loading pre-trained model 'facerec_resnet101_v3.pth'...
[OKAY] Model loaded successfully. Model size: 175.3MB
[DEBUG] Block ID_INFERENCE: Running forward pass on selected features.
[DEBUG] GPU acceleration: ENABLED (NVIDIA GeForce RTX 4090)
[INFO] Inference batch 1/10 complete... (Est. time remaining: 4.3s)
[INFO] Inference batch 5/10 complete... (Est. time remaining: 2.1s)
[INFO] Inference batch 10/10 complete.
[DEBUG] Block ID_POSTPROCESS: Applying confidence thresholding and non-max suppression.
[INFO] Post-processing complete. Outputting results...
[REPORT] Candidate matches found: 3
[REPORT] Top match: Subject_XYZ, Confidence: 0.987
[SECURITY] Logging compilation event to audit trail...
[OKAY] Audit log updated.
[INFO] Compilation sequence finished. Releasing resources.
  `
    .trim()
    .replace(/\n/g, "\n"); // Ensure newlines are actual newlines

  const commandTypingIntervalRef = useRef<number | null>(null);
  const codeTypingIntervalRef = useRef<number | null>(null);
  const resultTimeoutRef = useRef<number | null>(null);

  // Auto-scrolling effect
  useEffect(() => {
    if (scrollableContainerRef.current) {
      scrollableContainerRef.current.scrollTop =
        scrollableContainerRef.current.scrollHeight;
    }
  }, [typedCommand, typedCode, showResult, showPostErrorPrompt]); // Scroll on content change

  useEffect(() => {
    const commandTypingSpeed = 50;
    const codeTypingSpeed = 20;
    const charsPerBatch = 4;

    if (isCompiling) {
      setHasCompilationAttempted(true);
      setShowPostErrorPrompt(false);
      setTypedCommand(""); // Start empty for command typing
      setTypedCode("");
      setShowResult(false);

      let currentCommandIndex = 0;

      if (commandTypingIntervalRef.current)
        clearInterval(commandTypingIntervalRef.current);
      if (codeTypingIntervalRef.current)
        clearInterval(codeTypingIntervalRef.current);
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);

      // Start typing the command
      commandTypingIntervalRef.current = window.setInterval(() => {
        if (currentCommandIndex < commandToType.length) {
          // Append one character at a time for command
          setTypedCommand((prev) => prev + commandToType[currentCommandIndex]);
          currentCommandIndex++;
        } else {
          if (commandTypingIntervalRef.current)
            clearInterval(commandTypingIntervalRef.current);
          commandTypingIntervalRef.current = null;

          // Command finished, start typing code
          let currentCodeIndex = 0;
          codeTypingIntervalRef.current = window.setInterval(() => {
            if (currentCodeIndex < mockCode.length) {
              setTypedCode(
                (prev) =>
                  prev +
                  mockCode.substring(
                    currentCodeIndex,
                    currentCodeIndex + charsPerBatch
                  )
              );
              currentCodeIndex += charsPerBatch;
            } else {
              if (codeTypingIntervalRef.current)
                clearInterval(codeTypingIntervalRef.current);
              codeTypingIntervalRef.current = null;
            }
          }, codeTypingSpeed);
        }
      }, commandTypingSpeed);

      const typingDurationEstimate =
        commandToType.length * commandTypingSpeed +
        (mockCode.length / charsPerBatch) * codeTypingSpeed;
      // Timeout should be less than parent useGameState's 5000ms compile time
      const actualDisplayTimeout = 9000;

      resultTimeoutRef.current = window.setTimeout(() => {
        if (commandTypingIntervalRef.current)
          clearInterval(commandTypingIntervalRef.current);
        if (codeTypingIntervalRef.current)
          clearInterval(codeTypingIntervalRef.current);
        commandTypingIntervalRef.current = null;
        codeTypingIntervalRef.current = null;
        // Ensure command and typed code are fully shown if timeout cuts them short
        setTypedCommand(commandToType);
        // Set typedCode to its current state, or full if typing was faster than timeout
        // This ensures that whatever was typed up to this point is rendered before result shows
        // No, we actually want to let useGameState determine when isCompiling flips, then show full result
        setShowResult(true); // Ready to show result when isCompiling becomes false
      }, actualDisplayTimeout);
    } else {
      // When parent isCompiling is false
      // Clear any running typing intervals if compilation ended prematurely or was cancelled
      if (commandTypingIntervalRef.current)
        clearInterval(commandTypingIntervalRef.current);
      if (codeTypingIntervalRef.current)
        clearInterval(codeTypingIntervalRef.current);
      // Do not clear resultTimeoutRef here, as it might be the one that just fired to set setShowResult
      commandTypingIntervalRef.current = null;
      codeTypingIntervalRef.current = null;

      if (hasCompilationAttempted) {
        setShowResult(true); // Ensure result display is triggered
        if (errors.length > 0) {
          setShowPostErrorPrompt(true);
        } else {
          setShowPostErrorPrompt(false);
          // If successful, and we want to reset hasCompilationAttempted for a fresh state:
          // setHasCompilationAttempted(false); // Optional: reset for next interaction cycle
        }
      }
      // Only clear typed content if not showing a result from a recent attempt
      if (!showResult && !hasCompilationAttempted) {
        setTypedCommand("");
        setTypedCode("");
        setShowPostErrorPrompt(false);
      }
    }

    return () => {
      if (commandTypingIntervalRef.current)
        clearInterval(commandTypingIntervalRef.current);
      if (codeTypingIntervalRef.current)
        clearInterval(codeTypingIntervalRef.current);
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompiling]); // mockCode, commandToType, errors, hasCompilationAttempted removed to simplify deps and control flow

  const allBlocksPlaced = currentBlocksCount === maxBlocks;
  const isButtonDisabled =
    !allBlocksPlaced || isCompiling || !canCompileAfterAttempt;

  const shouldShowInitialPromptCursor =
    !isCompiling && !hasCompilationAttempted && !showPostErrorPrompt;
  const shouldShowCommandTypingCursor =
    isCompiling && typedCommand.length < commandToType.length;
  const shouldShowCodeTypingCursor =
    isCompiling && typedCommand.length === commandToType.length && !showResult;
  const shouldShowPostErrorPromptCursor = showPostErrorPrompt && !isCompiling;

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
          @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .button-gradient-compiling {
            background: linear-gradient(to right, #10B981, #059669, #047857, #065F46, #059669, #10B981);
            background-size: 300% 100%;
            animation: gradient-animation 3s ease infinite;
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
      <div className="relative h-full bg-black/40 border border-white/10 overflow-hidden flex flex-col">
        {/* MatrixEffect removed */}
        <div className="relative z-50 p-4 flex-grow flex flex-col justify-between">
          <div
            ref={scrollableContainerRef}
            className="font-mono text-sm overflow-y-auto h-full max-h-[calc(100%-4rem)] whitespace-pre-wrap break-all"
          >
            {/* Initial Prompt or Command Typing - always show prompt line if not showing post-error prompt and not success state */}
            {(!showPostErrorPrompt || isCompiling) &&
              !(showResult && !isCompiling && errors.length === 0) && (
                <div className="flex items-baseline mb-1">
                  <span className="text-terminal-green">adamx@PC:</span>
                  <span className="text-blue-400">~</span>
                  <span className="text-terminal-green">$</span>
                  <span className="ml-2 text-gray-300">{typedCommand}</span>
                  {shouldShowCommandTypingCursor && (
                    <span className="w-2 h-3.5 bg-gray-300 cursor-blink inline-block ml-1"></span>
                  )}
                  {shouldShowInitialPromptCursor && (
                    <span className="ml-2 w-2 h-3.5 bg-white cursor-blink inline-block"></span>
                  )}
                </div>
              )}

            {/* Typed Code Area */}
            {(isCompiling || (showResult && typedCode)) &&
              typedCode.length > 0 && (
                <div className="text-green-400 mt-1">
                  {typedCode}
                  {shouldShowCodeTypingCursor && (
                    <span className="w-2 h-3.5 bg-green-400 cursor-blink inline-block ml-1"></span>
                  )}
                </div>
              )}

            {/* Result Message Area OR Post-Error Prompt */}
            {showResult && !isCompiling && (
              <div className="mt-2">
                {errors.length > 0 ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                        <span className="text-red-400">
                          Compilation failed: {errors.length} error
                          {errors.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {/* New prompt after error */}
                    {showPostErrorPrompt && (
                      <div className="flex items-baseline mt-2 mb-1">
                        <span className="text-terminal-green">adamx@PC:</span>
                        <span className="text-blue-400">~</span>
                        <span className="text-terminal-green">$</span>
                        {shouldShowPostErrorPromptCursor && (
                          <span className="ml-2 w-2 h-3.5 bg-white cursor-blink inline-block"></span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-green-400">
                      Compilation Successful!
                    </span>
                    {/* Optionally, a new prompt after success too, if desired */}
                    {/* <div className="flex items-baseline mt-2 mb-1">
                            <span className="text-terminal-green">adamx@PC:</span><span className="text-blue-400">~</span><span className="text-terminal-green">$</span>
                            <span className="ml-2 w-2 h-3.5 bg-white cursor-blink inline-block"></span>
                        </div> */}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto pt-2 font-mono">
            <button
              onClick={onCompile}
              disabled={isButtonDisabled}
              className={`w-full sm:w-auto px-4 py-2 rounded text-sm flex items-center justify-center transition-all
                ${
                  isCompiling
                    ? "text-white button-gradient-compiling cursor-wait"
                    : !allBlocksPlaced || !canCompileAfterAttempt
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-60"
                    : "bg-terminal-green text-black font-semibold border border-green-600 bg-green-400  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 button-pulse-green"
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Terminal;
