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
  solution: string[];
}

const useGameState = ({
  initialAvailableBlocks,
  maxBlocks,
  hint = "",
  solution,
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
      const playerWorkspaceBlocks = gameState.workspace.filter(
        Boolean
      ) as Block[];
      const playerSolutionIds = playerWorkspaceBlocks.map((block) => block.id);

      if (playerSolutionIds.length !== solution.length) {
        setGameState((prev) => ({
          ...prev,
          isCompiling: false,
          errors: [
            `Oczekiwano ${solution.length} bloków, otrzymano ${playerSolutionIds.length}.`,
            `Upewnij się, że wszystkie wymagane sloty w Workspace są zapełnione.`,
          ],
        }));
        return;
      }

      const errorCount = playerSolutionIds.reduce((count, id, index) => {
        return id !== solution[index] ? count + 1 : count;
      }, 0);

      if (errorCount === 0) {
        setGameState((prev) => ({
          ...prev,
          isCompiling: false,
          errors: [],
        }));
      } else {
        const genericErrorMessages = new Array(errorCount).fill(
          "An error occurred"
        );
        setGameState((prev) => ({
          ...prev,
          isCompiling: false,
          errors: genericErrorMessages,
        }));
      }
    }, 5000);
  }, [gameState.workspace, solution, maxBlocks]);

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
  }, [initialAvailableBlocks, maxBlocks, hint, solution]);

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
