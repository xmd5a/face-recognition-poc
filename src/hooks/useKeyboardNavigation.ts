import { useCallback, useEffect, useState, useRef } from "react";
import { type Block } from "../components/BlockList";

type Column = "blocks" | "workspace";

interface UseKeyboardNavigationProps {
  availableBlocks: Block[];
  workspace: Block[];
  selectedBlockId: string | null;
  onBlockSelect: (block: Block | null) => void;
  onWorkspaceChange: (blocks: Block[]) => void;
  onCompile: () => void;
}

export const useKeyboardNavigation = ({
  availableBlocks,
  workspace,
  selectedBlockId,
  onBlockSelect,
  onWorkspaceChange,
  onCompile,
}: UseKeyboardNavigationProps) => {
  const [activeColumn, setActiveColumn] = useState<Column>("blocks");
  const [indices, setIndices] = useState({
    blocks: 0,
    workspace: 0,
  });
  const [keyboardNavJustActivated, setKeyboardNavJustActivated] =
    useState(false);

  // Ref to track if onBlockSelect was called by this hook recently
  // to avoid re-triggering selection logic in useEffect if selectedBlockId
  // changes due to this hook's own action.
  const blockSelectionTriggeredByHook = useRef(false);

  useEffect(() => {
    if (blockSelectionTriggeredByHook.current) {
      blockSelectionTriggeredByHook.current = false;
      // If selection was made by this hook, ensure indices are synced if needed
      const listForSync =
        activeColumn === "blocks" ? availableBlocks : workspace;
      const selectedIdx = listForSync.findIndex(
        (b) => b.id === selectedBlockId
      );
      if (selectedIdx !== -1 && indices[activeColumn] !== selectedIdx) {
        setIndices((prev) => ({ ...prev, [activeColumn]: selectedIdx }));
      }
      return;
    }

    const currentList = activeColumn === "blocks" ? availableBlocks : workspace;
    let newIndexToSelect = indices[activeColumn]; // Start with the last known index for this column

    // Is the globally selected block currently in our active list?
    const वैश्विकSelectedBlock = currentList.find(
      (b) => b.id === selectedBlockId
    );

    if (वैश्विकSelectedBlock) {
      // A block in the current active column is ALREADY globally selected.
      // We just need to make sure our internal `indices` for this column are synced with it.
      const idxOfGlobalSelection = currentList.findIndex(
        (b) => b.id === selectedBlockId
      );
      if (
        idxOfGlobalSelection !== -1 &&
        indices[activeColumn] !== idxOfGlobalSelection
      ) {
        setIndices((prev) => ({
          ...prev,
          [activeColumn]: idxOfGlobalSelection,
        }));
      }
      // No need to call onBlockSelect, it's already selected.
    } else {
      // No block in the current active column is globally selected.
      // This means we NEED to select a block in this column (or deselect all if empty).
      if (currentList.length > 0) {
        // There are blocks in this column to select from.
        // Validate newIndexToSelect (which is indices[activeColumn])
        if (newIndexToSelect >= currentList.length || newIndexToSelect < 0) {
          newIndexToSelect = 0; // Default to first block if saved index is invalid
        }
        setIndices((prev) => ({ ...prev, [activeColumn]: newIndexToSelect }));
        blockSelectionTriggeredByHook.current = true;
        onBlockSelect(currentList[newIndexToSelect]);
      } else {
        // Current column is empty, deselect if anything was selected.
        setIndices((prev) => ({ ...prev, [activeColumn]: 0 })); // Reset index for this empty column
        if (selectedBlockId !== null) {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(null);
        }
      }
    }
  }, [
    activeColumn,
    availableBlocks,
    workspace,
    selectedBlockId,
    onBlockSelect,
    indices,
  ]);

  useEffect(() => {
    const down = () => setKeyboardNavJustActivated(true);
    window.addEventListener("keydown", down, { once: true, capture: true });
    return () => window.removeEventListener("keydown", down, true);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const currentList =
        activeColumn === "blocks" ? availableBlocks : workspace;
      let currentIndexInList = indices[activeColumn];

      if (currentIndexInList >= currentList.length && currentList.length > 0) {
        currentIndexInList = currentList.length - 1;
      }
      if (currentList.length === 0) {
        currentIndexInList = 0;
      }

      if (keyboardNavJustActivated && selectedBlockId) {
        const indexFromSelection = currentList.findIndex(
          (b) => b.id === selectedBlockId
        );
        if (indexFromSelection !== -1) {
          currentIndexInList = indexFromSelection;
        }
        setKeyboardNavJustActivated(false);
      }

      let newIndex = currentIndexInList;
      const maxIndex = currentList.length > 0 ? currentList.length - 1 : 0;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          if (currentList.length > 0) {
            newIndex =
              currentIndexInList > 0 ? currentIndexInList - 1 : maxIndex;
          }
          break;

        case "ArrowDown":
          event.preventDefault();
          if (currentList.length > 0) {
            newIndex =
              currentIndexInList < maxIndex ? currentIndexInList + 1 : 0;
          }
          break;

        case "ArrowLeft":
          event.preventDefault();
          if (activeColumn === "workspace") {
            setActiveColumn("blocks");
          }
          break;

        case "ArrowRight":
          event.preventDefault();
          if (activeColumn === "blocks") {
            setActiveColumn("workspace");
          }
          break;

        case "e":
        case "E":
          event.preventDefault();
          if (currentList.length > 0 && currentList[currentIndexInList]) {
            const blockToMove = currentList[currentIndexInList];
            if (
              activeColumn === "blocks" &&
              !workspace.find((b) => b.id === blockToMove.id)
            ) {
              onWorkspaceChange([...workspace, blockToMove]);
              const newAvailableBlocks = availableBlocks.filter(
                (b) => b.id !== blockToMove.id
              );
              let newBlocksIndex = currentIndexInList;
              if (
                newBlocksIndex >= newAvailableBlocks.length &&
                newAvailableBlocks.length > 0
              ) {
                newBlocksIndex = newAvailableBlocks.length - 1;
              }
              setIndices((prev) => ({ ...prev, blocks: newBlocksIndex }));
              if (newAvailableBlocks.length > 0) {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(newAvailableBlocks[newBlocksIndex]);
              } else if (selectedBlockId !== null) {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(null);
              }
            } else if (activeColumn === "workspace") {
              const newWorkspace = workspace.filter(
                (_, i) => i !== currentIndexInList
              );
              onWorkspaceChange(newWorkspace);
              let newWorkspaceIndex = currentIndexInList;
              if (
                newWorkspaceIndex >= newWorkspace.length &&
                newWorkspace.length > 0
              ) {
                newWorkspaceIndex = newWorkspace.length - 1;
              }
              setIndices((prev) => ({ ...prev, workspace: newWorkspaceIndex }));
              if (newWorkspace.length > 0) {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(newWorkspace[newWorkspaceIndex]);
              } else if (selectedBlockId !== null) {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(null);
              }
            }
          }
          break;

        case "Enter":
          event.preventDefault();
          onCompile();
          break;

        default:
          return;
      }

      if (
        currentList.length > 0 &&
        newIndex !== currentIndexInList &&
        event.key !== "e" &&
        event.key !== "E" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight"
      ) {
        setIndices((prev) => ({ ...prev, [activeColumn]: newIndex }));
        if (currentList[newIndex]) {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(currentList[newIndex]);
        }
      }
    },
    [
      activeColumn,
      indices,
      availableBlocks,
      workspace,
      selectedBlockId,
      onBlockSelect,
      onWorkspaceChange,
      onCompile,
      keyboardNavJustActivated,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    activeColumn,
    setActiveColumn,
    indices,
  };
};
