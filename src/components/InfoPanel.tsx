import { motion, AnimatePresence } from "framer-motion";
import { type Block } from "./BlockList";

interface InfoPanelProps {
  selectedBlock: Block | null;
  hint: string;
}

const InfoPanel = ({ selectedBlock, hint }: InfoPanelProps) => {
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Scenario Hint */}
      <div className="flex-1 p-4 bg-black/30 rounded-lg">
        <h2 className="text-green-400 font-mono mb-2">Scenario Hint</h2>
        <div className="prose prose-sm prose-invert">
          <div
            className="text-green-300/70"
            dangerouslySetInnerHTML={{ __html: hint }}
          />
        </div>
      </div>

      {/* Block Description */}
      <div className="flex-1 p-4 bg-black/30 rounded-lg">
        <h2 className="text-green-400 font-mono mb-2">Block Description</h2>
        <AnimatePresence mode="wait">
          {selectedBlock ? (
            <motion.div
              key={selectedBlock.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-green-300/70"
            >
              <h3 className="font-mono text-green-400 mb-2">
                {selectedBlock.name}
              </h3>
              <p>{selectedBlock.description}</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center text-green-500/50"
            >
              Select a block to view its description
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Legend */}
      <div className="p-4 bg-black/30 rounded-lg">
        <div className="text-green-400/70 text-sm font-mono">
          [↑/↓] Select block | [←/→] Change column | [E] Move block | [Enter]
          Compile
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
