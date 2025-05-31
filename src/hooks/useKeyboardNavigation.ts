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
    const list = activeColumn === "blocks" ? availableBlocks : workspace;
    let targetIndex = indices[activeColumn];

    const currentBlockInThisColumnIsSelected = list.find(
      (b) => b.id === selectedBlockId
    );

    if (blockSelectionTriggeredByHook.current) {
      blockSelectionTriggeredByHook.current = false;
      // If selection was just made by this hook, ensure indices are synced if needed
      // but don't re-trigger onBlockSelect unless absolutely necessary.
      const selectedIdx = list.findIndex((b) => b.id === selectedBlockId);
      if (selectedIdx !== -1 && indices[activeColumn] !== selectedIdx) {
        setIndices((prev) => ({ ...prev, [activeColumn]: selectedIdx }));
      }
      return;
    }

    if (currentBlockInThisColumnIsSelected) {
      const selectedIdx = list.findIndex((b) => b.id === selectedBlockId);
      if (selectedIdx !== -1 && indices[activeColumn] !== selectedIdx) {
        setIndices((prev) => ({ ...prev, [activeColumn]: selectedIdx }));
      }
    } else {
      if (list.length > 0) {
        if (targetIndex >= list.length || targetIndex < 0) {
          targetIndex = 0;
        }
        setIndices((prev) => ({ ...prev, [activeColumn]: targetIndex }));
        blockSelectionTriggeredByHook.current = true;
        onBlockSelect(list[targetIndex]);
      } else {
        setIndices((prev) => ({ ...prev, [activeColumn]: 0 }));
        if (selectedBlockId !== null) {
          // Only call if there's something to deselect
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
  ]); // Added indices back for now

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

      // Ensure currentIndex is valid for the currentList
      if (currentIndexInList >= currentList.length && currentList.length > 0) {
        currentIndexInList = currentList.length - 1;
      }
      if (currentList.length === 0) {
        currentIndexInList = 0; // Default to 0 if list is empty
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
            // Optional: Deselect block in workspace column if one is selected
            // if (selectedBlockId && workspace.find(b => b.id === selectedBlockId)) {
            //   blockSelectionTriggeredByHook.current = true;
            //   onBlockSelect(null);
            // }
            setActiveColumn("blocks");
          }
          break;

        case "ArrowRight":
          event.preventDefault();
          if (activeColumn === "blocks") {
            // Optional: Deselect block in availableBlocks column if one is selected
            // This should ideally be handled by the Game.tsx useEffect for activeColumn change
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
