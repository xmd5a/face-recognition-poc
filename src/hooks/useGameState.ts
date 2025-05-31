import { useState, useCallback } from "react";
import type { Block } from "../components/BlockList";

interface GameState {
  workspace: (Block | null)[];
  selectedBlockId: string | null;
  isCompiling: boolean;
  errors: string[];
  availableBlocks: Block[];
  levelHint: string; // Added for potential future use
}

interface UseGameStateProps {
  initialAvailableBlocks: Block[];
  maxBlocks: number;
  hint?: string; // Added for potential future use
}

const useGameState = ({
  initialAvailableBlocks,
  maxBlocks,
  hint = "",
}: UseGameStateProps) => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    workspace: new Array(maxBlocks).fill(null),
    selectedBlockId: null,
    isCompiling: false,
    errors: [],
    availableBlocks: initialAvailableBlocks,
    levelHint: hint,
  }));

  const selectBlock = useCallback((blockId: string | null) => {
    setGameState((prev) => ({ ...prev, selectedBlockId: blockId }));
  }, []);

  const setWorkspace = useCallback(
    (newWorkspace: (Block | null)[]) => {
      setGameState((prev) => {
        const finalWs = new Array(prev.workspace.length).fill(null);
        newWorkspace.forEach((block, index) => {
          if (index < finalWs.length) {
            finalWs[index] = block;
          }
        });

        const workspaceBlockIds = new Set(
          finalWs.filter(Boolean).map((b) => b!.id)
        );
        const newFilteredAvailableBlocks = initialAvailableBlocks.filter(
          (ab) => !workspaceBlockIds.has(ab.id)
        );

        return {
          ...prev,
          workspace: finalWs,
          availableBlocks: newFilteredAvailableBlocks,
          selectedBlockId:
            prev.selectedBlockId && workspaceBlockIds.has(prev.selectedBlockId)
              ? prev.selectedBlockId
              : null,
        };
      });
    },
    [initialAvailableBlocks, maxBlocks]
  );

  const compile = useCallback(() => {
    setGameState((prev) => ({ ...prev, isCompiling: true, errors: [] }));
    // Simulate compilation
    setTimeout(() => {
      const commands = gameState.workspace
        .filter(Boolean)
        .map((block) => block!.command);
      // Basic validation example (can be expanded)
      if (commands.length !== maxBlocks) {
        setGameState((prev) => ({
          ...prev,
          isCompiling: false,
          errors: [
            `Error: Expected ${maxBlocks} blocks, got ${commands.length}.`,
          ],
        }));
        return;
      }
      // Simulate success
      setGameState((prev) => ({
        ...prev,
        isCompiling: false,
        errors: ["Compilation successful! All systems nominal."],
      }));
    }, 1500);
  }, [gameState.workspace, maxBlocks]);

  const reset = useCallback(() => {
    setGameState({
      workspace: new Array(maxBlocks).fill(null),
      selectedBlockId: null,
      isCompiling: false,
      errors: [],
      availableBlocks: initialAvailableBlocks,
      levelHint: hint,
    });
  }, [initialAvailableBlocks, maxBlocks, hint]);

  return {
    ...gameState,
    currentBlocksCount: gameState.workspace.filter(Boolean).length,
    actions: {
      selectBlock,
      setWorkspace,
      compile,
      reset,
    },
  };
};

export default useGameState;
