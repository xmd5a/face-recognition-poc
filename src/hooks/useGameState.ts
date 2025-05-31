import { useState, useCallback } from "react";
import type { Block } from "../components/BlockList";

interface GameState {
  workspace: (Block | null)[];
  selectedBlockId: string | null;
  isCompiling: boolean;
  errors: string[];
  availableBlockSlots: (Block | null)[];
  levelHint: string;
}

interface UseGameStateProps {
  initialAvailableBlocks: Block[];
  maxBlocks: number;
  hint?: string;
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
    availableBlockSlots: initialAvailableBlocks.map((b) =>
      b ? { ...b } : null
    ),
    levelHint: hint,
  }));

  const selectBlock = useCallback((blockId: string | null) => {
    setGameState((prev) => ({ ...prev, selectedBlockId: blockId }));
  }, []);

  const setAvailableBlockSlots = useCallback((newSlots: (Block | null)[]) => {
    setGameState((prev) => ({ ...prev, availableBlockSlots: newSlots }));
  }, []);

  const setWorkspace = useCallback(
    (newWorkspace: (Block | null)[]) => {
      setGameState((prev) => {
        const finalWs = new Array(maxBlocks).fill(null);
        newWorkspace.forEach((block, index) => {
          if (index < finalWs.length) {
            finalWs[index] = block;
          }
        });

        const workspaceBlockIds = new Set(
          finalWs.filter(Boolean).map((b) => b!.id)
        );
        let newSelectedBlockId = prev.selectedBlockId;
        if (
          prev.selectedBlockId &&
          !workspaceBlockIds.has(prev.selectedBlockId)
        ) {
          const selectedInAvailableSlots = prev.availableBlockSlots.find(
            (b) => b?.id === prev.selectedBlockId
          );
          if (!selectedInAvailableSlots) {
            newSelectedBlockId = null;
          }
        }

        return {
          ...prev,
          workspace: finalWs,
          selectedBlockId: newSelectedBlockId,
        };
      });
    },
    [maxBlocks]
  );

  const compile = useCallback(() => {
    setGameState((prev) => ({ ...prev, isCompiling: true, errors: [] }));
    setTimeout(() => {
      const commands = gameState.workspace
        .filter(Boolean)
        .map((block) => block!.command);
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
      availableBlockSlots: initialAvailableBlocks.map((b) =>
        b ? { ...b } : null
      ),
      levelHint: hint,
    });
  }, [initialAvailableBlocks, maxBlocks, hint]);

  return {
    ...gameState,
    currentBlocksCount: gameState.workspace.filter(Boolean).length,
    actions: {
      selectBlock,
      setWorkspace,
      setAvailableBlockSlots,
      compile,
      reset,
    },
  };
};

export default useGameState;
