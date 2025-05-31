import { useState, useCallback, useMemo } from "react";
import type { Block } from "../components/BlockList";

interface UseGameStateProps {
  availableBlocks: Block[];
  maxBlocks: number;
}

const useGameState = ({ availableBlocks, maxBlocks }: UseGameStateProps) => {
  const [workspace, setWorkspace] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [errors, setErrors] = useState(0);

  // Filtruj dostępne bloki - pokazuj tylko te, których nie ma w workspace
  const filteredAvailableBlocks = useMemo(() => {
    const workspaceIds = new Set(workspace.map((block) => block.id));
    return availableBlocks.filter((block) => !workspaceIds.has(block.id));
  }, [availableBlocks, workspace]);

  const handleBlockSelect = useCallback((block: Block) => {
    setSelectedBlockId(block.id);
  }, []);

  const handleAddBlock = useCallback(
    (block: Block) => {
      if (workspace.length >= maxBlocks) return;
      setWorkspace((prev) => [...prev, block]);
      setSelectedBlockId(null);
    },
    [workspace.length, maxBlocks]
  );

  const handleRemoveBlock = useCallback((blockId: string) => {
    setWorkspace((prev) => prev.filter((block) => block.id !== blockId));
    setSelectedBlockId(null);
  }, []);

  const handleCompile = useCallback(() => {
    setIsCompiling(true);
    // Symulacja procesu kompilacji - wydłużona o 3 sekundy
    setTimeout(() => {
      setErrors(Math.floor(Math.random() * 3)); // Losowa liczba błędów (0-2)
      setIsCompiling(false);
    }, 6000); // Zmienione z 3000 na 6000
  }, []);

  const handleReset = useCallback(() => {
    setErrors(0);
  }, []);

  return {
    workspace,
    selectedBlockId,
    isCompiling,
    errors,
    availableBlocks: filteredAvailableBlocks,
    actions: {
      selectBlock: handleBlockSelect,
      addBlock: handleAddBlock,
      removeBlock: handleRemoveBlock,
      compile: handleCompile,
      reset: handleReset,
    },
  };
};

export default useGameState;
