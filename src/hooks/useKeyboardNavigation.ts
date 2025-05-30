import { useCallback, useEffect, useState } from "react";
import { type Block } from "../components/BlockList";

type Column = "blocks" | "workspace" | "info";

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
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const currentList =
        activeColumn === "blocks" ? availableBlocks : workspace;
      const maxIndex = currentList.length - 1;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
          if (currentList[selectedIndex]) {
            onBlockSelect(currentList[selectedIndex]);
          }
          break;

        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
          if (currentList[selectedIndex]) {
            onBlockSelect(currentList[selectedIndex]);
          }
          break;

        case "ArrowLeft":
          event.preventDefault();
          if (activeColumn === "workspace") {
            setActiveColumn("blocks");
            setSelectedIndex(0);
          } else if (activeColumn === "info") {
            setActiveColumn("workspace");
            setSelectedIndex(0);
          }
          break;

        case "ArrowRight":
          event.preventDefault();
          if (activeColumn === "blocks") {
            setActiveColumn("workspace");
            setSelectedIndex(0);
          } else if (activeColumn === "workspace") {
            setActiveColumn("info");
            setSelectedIndex(0);
          }
          break;

        case "e":
        case "E":
          event.preventDefault();
          if (activeColumn === "blocks" && currentList[selectedIndex]) {
            // Move block to workspace
            const block = currentList[selectedIndex];
            if (!workspace.find((b) => b.id === block.id)) {
              onWorkspaceChange([...workspace, block]);
            }
          } else if (
            activeColumn === "workspace" &&
            currentList[selectedIndex]
          ) {
            // Remove block from workspace
            const newWorkspace = workspace.filter(
              (_, index) => index !== selectedIndex
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
      selectedIndex,
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
    selectedIndex,
  };
};
