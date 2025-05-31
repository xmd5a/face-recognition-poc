import { useCallback, useEffect, useState } from "react";
import { type Block } from "../components/BlockList";

type Column = "blocks" | "workspace";

interface UseKeyboardNavigationProps {
  availableBlocks: Block[];
  workspace: Block[];
  onBlockSelect: (block: Block) => void;
  onWorkspaceChange: (blocks: Block[]) => void;
  onCompile: () => void;
}

export const useKeyboardNavigation = ({
  availableBlocks,
  workspace,
  onBlockSelect,
  onWorkspaceChange,
  onCompile,
}: UseKeyboardNavigationProps) => {
  const [activeColumn, setActiveColumn] = useState<Column>("blocks");
  const [indices, setIndices] = useState({
    blocks: 0,
    workspace: 0,
  });

  // Helper function to get the current list and its max index
  const getCurrentListInfo = (column: Column) => {
    const list = column === "blocks" ? availableBlocks : workspace;
    const maxIndex = Math.max(0, list.length - 1);
    return { list, maxIndex };
  };

  // Helper function to ensure index is within bounds for the given column
  const getValidIndex = (index: number, column: Column) => {
    const { maxIndex } = getCurrentListInfo(column);
    return Math.min(Math.max(0, index), maxIndex);
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { list, maxIndex } = getCurrentListInfo(activeColumn);
      let newIndex: number;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          newIndex =
            indices[activeColumn] > 0 ? indices[activeColumn] - 1 : maxIndex;
          setIndices((prev) => ({ ...prev, [activeColumn]: newIndex }));
          if (list[newIndex]) {
            onBlockSelect(list[newIndex]);
          }
          break;

        case "ArrowDown":
          event.preventDefault();
          newIndex =
            indices[activeColumn] < maxIndex ? indices[activeColumn] + 1 : 0;
          setIndices((prev) => ({ ...prev, [activeColumn]: newIndex }));
          if (list[newIndex]) {
            onBlockSelect(list[newIndex]);
          }
          break;

        case "ArrowLeft":
          event.preventDefault();
          if (activeColumn === "workspace") {
            setActiveColumn("blocks");
            const newIndex = getValidIndex(indices.blocks, "blocks");
            if (availableBlocks[newIndex]) {
              onBlockSelect(availableBlocks[newIndex]);
            }
          }
          break;

        case "ArrowRight":
          event.preventDefault();
          if (activeColumn === "blocks") {
            setActiveColumn("workspace");
            const newIndex = getValidIndex(indices.workspace, "workspace");
            if (workspace[newIndex]) {
              onBlockSelect(workspace[newIndex]);
            }
          }
          break;

        case "e":
        case "E":
          event.preventDefault();
          if (activeColumn === "blocks" && list[indices[activeColumn]]) {
            const block = list[indices[activeColumn]];
            if (!workspace.find((b) => b.id === block.id)) {
              onWorkspaceChange([...workspace, block]);
            }
          } else if (
            activeColumn === "workspace" &&
            list[indices[activeColumn]]
          ) {
            const newWorkspace = workspace.filter(
              (_, index) => index !== indices[activeColumn]
            );
            onWorkspaceChange(newWorkspace);
          }
          break;

        case "Enter":
          event.preventDefault();
          onCompile();
          break;

        default:
          break;
      }
    },
    [
      activeColumn,
      indices,
      availableBlocks,
      workspace,
      onBlockSelect,
      onWorkspaceChange,
      onCompile,
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
    selectedIndex: indices[activeColumn] || 0,
  };
};
