import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    const list = activeColumn === "blocks" ? availableBlocks : workspace;
    const currentSelectedIndex = list.findIndex(
      (b) => b.id === selectedBlockId
    );
    if (currentSelectedIndex !== -1) {
      setIndices((prev) => ({ ...prev, [activeColumn]: currentSelectedIndex }));
    } else {
      setIndices((prev) => ({ ...prev, [activeColumn]: 0 }));
    }
  }, [selectedBlockId, activeColumn, availableBlocks, workspace]);

  useEffect(() => {
    const down = () => setKeyboardNavJustActivated(true);
    window.addEventListener("keydown", down, { once: true, capture: true });
    return () => window.removeEventListener("keydown", down, true);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const list = activeColumn === "blocks" ? availableBlocks : workspace;
      if (!list.length) return;

      let currentIndex = indices[activeColumn];

      if (keyboardNavJustActivated && selectedBlockId) {
        const indexFromSelection = list.findIndex(
          (b) => b.id === selectedBlockId
        );
        if (indexFromSelection !== -1) {
          currentIndex = indexFromSelection;
        }
        setKeyboardNavJustActivated(false);
      }

      let newIndex = currentIndex;
      const maxIndex = list.length - 1;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
          break;

        case "ArrowDown":
          event.preventDefault();
          newIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
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
          if (list[currentIndex]) {
            const blockToMove = list[currentIndex];
            if (
              activeColumn === "blocks" &&
              !workspace.find((b) => b.id === blockToMove.id)
            ) {
              onWorkspaceChange([...workspace, blockToMove]);
              const newAvailableBlocks = availableBlocks.filter(
                (b) => b.id !== blockToMove.id
              );
              let newBlocksIndex = currentIndex;
              if (
                currentIndex >= newAvailableBlocks.length &&
                newAvailableBlocks.length > 0
              ) {
                newBlocksIndex = newAvailableBlocks.length - 1;
              }
              setIndices((prev) => ({ ...prev, blocks: newBlocksIndex }));
              if (newAvailableBlocks.length > 0) {
                onBlockSelect(newAvailableBlocks[newBlocksIndex]);
              } else {
                onBlockSelect(null);
              }
            } else if (activeColumn === "workspace") {
              const newWorkspace = workspace.filter(
                (_, index) => index !== currentIndex
              );
              onWorkspaceChange(newWorkspace);
              let newWorkspaceIndex = currentIndex;
              if (
                currentIndex >= newWorkspace.length &&
                newWorkspace.length > 0
              ) {
                newWorkspaceIndex = newWorkspace.length - 1;
              }
              setIndices((prev) => ({ ...prev, workspace: newWorkspaceIndex }));
              if (newWorkspace.length > 0) {
                onBlockSelect(newWorkspace[newWorkspaceIndex]);
              } else {
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
        (newIndex !== currentIndex && event.key !== "e" && event.key !== "E") ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
      ) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
          setIndices((prev) => ({ ...prev, [activeColumn]: newIndex }));
          if (list[newIndex]) {
            onBlockSelect(list[newIndex]);
          }
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
