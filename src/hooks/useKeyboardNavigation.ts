import { useCallback, useEffect, useState, useRef } from "react";
import { type Block } from "../components/BlockList";
import { type BlockToMoveInfo, type GhostTargetInfo } from "../components/Game";

export type Column = "blocks" | "workspace";

interface UseKeyboardNavigationProps {
  availableBlocks: Block[];
  workspace: (Block | null)[];
  selectedBlockId: string | null;
  onBlockSelect: (block: Block | null) => void;
  onWorkspaceChange: (blocks: (Block | null)[]) => void;
  onCompile: () => void;
  blockToMoveInfo: BlockToMoveInfo | null;
  setBlockToMoveInfo: React.Dispatch<
    React.SetStateAction<BlockToMoveInfo | null>
  >;
  ghostTargetInfo: GhostTargetInfo | null;
  setGhostTargetInfo: React.Dispatch<
    React.SetStateAction<GhostTargetInfo | null>
  >;
  maxBlocks: number;
}

export const useKeyboardNavigation = ({
  availableBlocks,
  workspace,
  selectedBlockId,
  onBlockSelect,
  onWorkspaceChange,
  onCompile,
  blockToMoveInfo,
  setBlockToMoveInfo,
  ghostTargetInfo,
  setGhostTargetInfo,
  maxBlocks,
}: UseKeyboardNavigationProps) => {
  const [activeColumn, setActiveColumn] = useState<Column>("blocks");
  const [indices, setIndices] = useState({
    blocks: 0,
    workspace: 0,
  });
  const [keyboardNavJustActivated, setKeyboardNavJustActivated] =
    useState(false);

  const blockSelectionTriggeredByHook = useRef(false);

  useEffect(() => {
    if (blockSelectionTriggeredByHook.current) {
      blockSelectionTriggeredByHook.current = false;
      const listForSync =
        activeColumn === "blocks"
          ? availableBlocks
          : (workspace.filter(Boolean) as Block[]);
      const selectedIdx = listForSync.findIndex(
        (b) => b.id === selectedBlockId
      );
      if (selectedIdx !== -1 && indices[activeColumn] !== selectedIdx) {
        setIndices((prev) => ({ ...prev, [activeColumn]: selectedIdx }));
      }
      return;
    }

    if (
      blockToMoveInfo &&
      activeColumn ===
        (blockToMoveInfo.sourceColumn === "blocks" ? "workspace" : "blocks")
    ) {
      const targetList =
        activeColumn === "workspace"
          ? (workspace.filter(Boolean) as Block[])
          : availableBlocks;
      let foundTargetIndex = -1;
      let isPlaceholderTarget = false;
      let targetBlockEntityId: string | null = null;

      if (activeColumn === "workspace") {
        const firstEmptyPlaceholderIndex = workspace
          .slice(0, maxBlocks)
          .findIndex((slot) => slot === null);
        if (firstEmptyPlaceholderIndex !== -1) {
          foundTargetIndex = firstEmptyPlaceholderIndex;
          isPlaceholderTarget = true;
        } else if (workspace.filter(Boolean).length > 0) {
          foundTargetIndex = indices[activeColumn];
          const denseWorkspace = workspace.filter(Boolean) as Block[];
          if (foundTargetIndex >= denseWorkspace.length || foundTargetIndex < 0)
            foundTargetIndex = 0;
          isPlaceholderTarget = false;
          targetBlockEntityId = denseWorkspace[foundTargetIndex]?.id || null;
        }
      } else {
        if (availableBlocks.length > 0) {
          foundTargetIndex = indices.blocks;
          if (
            foundTargetIndex >= availableBlocks.length ||
            foundTargetIndex < 0
          )
            foundTargetIndex = 0;
          isPlaceholderTarget = false;
          targetBlockEntityId = availableBlocks[foundTargetIndex]?.id || null;
        }
      }

      if (foundTargetIndex !== -1) {
        setGhostTargetInfo({
          targetColumn: activeColumn,
          targetIndex: foundTargetIndex,
          isTargetPlaceholder: isPlaceholderTarget,
          targetBlockId: targetBlockEntityId,
        });
        blockSelectionTriggeredByHook.current = true;
        if (!isPlaceholderTarget && targetList[foundTargetIndex]) {
          onBlockSelect(targetList[foundTargetIndex]);
        } else if (isPlaceholderTarget) {
          onBlockSelect(null);
        }
      } else {
        setGhostTargetInfo(null);
        onBlockSelect(null);
      }
      return;
    }

    if (blockToMoveInfo && activeColumn === blockToMoveInfo.sourceColumn) {
      if (selectedBlockId !== blockToMoveInfo.id) {
        blockSelectionTriggeredByHook.current = true;
        onBlockSelect(blockToMoveInfo.sourceData);
      }
      return;
    }

    const currentList =
      activeColumn === "blocks"
        ? availableBlocks
        : (workspace.filter(Boolean) as Block[]);
    let newIndexToSelect = indices[activeColumn];
    const वैश्विकSelectedBlock = currentList.find(
      (b) => b.id === selectedBlockId
    );

    if (वैश्विकSelectedBlock) {
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
    } else {
      if (currentList.length > 0) {
        if (newIndexToSelect >= currentList.length || newIndexToSelect < 0) {
          newIndexToSelect = 0;
        }
        setIndices((prev) => ({ ...prev, [activeColumn]: newIndexToSelect }));
        blockSelectionTriggeredByHook.current = true;
        onBlockSelect(currentList[newIndexToSelect]);
      } else {
        setIndices((prev) => ({ ...prev, [activeColumn]: 0 }));
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
    blockToMoveInfo,
    setGhostTargetInfo,
    maxBlocks,
  ]);

  useEffect(() => {
    const down = () => setKeyboardNavJustActivated(true);
    window.addEventListener("keydown", down, { once: true, capture: true });
    return () => window.removeEventListener("keydown", down, true);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const denseCurrentList =
        activeColumn === "blocks"
          ? availableBlocks
          : (workspace.filter(Boolean) as Block[]);
      let currentIndexInList = indices[activeColumn];

      if (
        currentIndexInList >= denseCurrentList.length &&
        denseCurrentList.length > 0
      ) {
        currentIndexInList = denseCurrentList.length - 1;
      }
      if (denseCurrentList.length === 0) {
        currentIndexInList = 0;
      }

      if (keyboardNavJustActivated && selectedBlockId) {
        const indexFromSelection = denseCurrentList.findIndex(
          (b) => b.id === selectedBlockId
        );
        if (indexFromSelection !== -1) {
          currentIndexInList = indexFromSelection;
        }
        setKeyboardNavJustActivated(false);
      }

      let newIndex = currentIndexInList;
      const maxIndex =
        denseCurrentList.length > 0 ? denseCurrentList.length - 1 : 0;

      if (
        blockToMoveInfo &&
        activeColumn === blockToMoveInfo.sourceColumn &&
        (event.key === "ArrowUp" || event.key === "ArrowDown")
      ) {
        event.preventDefault();
        return;
      }

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          if (denseCurrentList.length > 0) {
            newIndex =
              currentIndexInList > 0 ? currentIndexInList - 1 : maxIndex;
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          if (denseCurrentList.length > 0) {
            newIndex =
              currentIndexInList < maxIndex ? currentIndexInList + 1 : 0;
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (!blockToMoveInfo && activeColumn === "workspace") {
            setActiveColumn("blocks");
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (!blockToMoveInfo && activeColumn === "blocks") {
            setActiveColumn("workspace");
          }
          break;
        case "Escape":
          if (blockToMoveInfo) {
            event.preventDefault();
            const originalSourceColumn = blockToMoveInfo.sourceColumn;
            const originalBlockToSelect = blockToMoveInfo.sourceData;
            setBlockToMoveInfo(null);
            setGhostTargetInfo(null);
            setActiveColumn(originalSourceColumn);
            blockSelectionTriggeredByHook.current = true;
            onBlockSelect(originalBlockToSelect);
          }
          break;
        case "e":
        case "E":
          event.preventDefault();
          if (!blockToMoveInfo) {
            const blockToInitiateMove = denseCurrentList[currentIndexInList];
            if (blockToInitiateMove) {
              setBlockToMoveInfo({
                id: blockToInitiateMove.id,
                sourceColumn: activeColumn,
                sourceData: blockToInitiateMove,
                sourceIndex:
                  activeColumn === "workspace"
                    ? workspace.findIndex(
                        (b) => b?.id === blockToInitiateMove.id
                      )
                    : currentIndexInList,
              });
              const targetColumnForGhost =
                activeColumn === "blocks" ? "workspace" : "blocks";
              setActiveColumn(targetColumnForGhost);
            }
          } else {
            if (
              ghostTargetInfo &&
              activeColumn === ghostTargetInfo.targetColumn
            ) {
              const sourceBlockData = blockToMoveInfo.sourceData;
              const tempWorkspace = [...workspace];
              let newAvailableBlocks = [...availableBlocks];

              if (ghostTargetInfo.targetColumn === "workspace") {
                if (ghostTargetInfo.isTargetPlaceholder) {
                  tempWorkspace[ghostTargetInfo.targetIndex] = sourceBlockData;
                  if (blockToMoveInfo.sourceColumn === "blocks") {
                    newAvailableBlocks = newAvailableBlocks.filter(
                      (b) => b.id !== sourceBlockData.id
                    );
                  } else {
                    tempWorkspace[blockToMoveInfo.sourceIndex] = null;
                  }
                } else {
                  const blockToSwapOut =
                    tempWorkspace[ghostTargetInfo.targetIndex];
                  tempWorkspace[ghostTargetInfo.targetIndex] = sourceBlockData;
                  if (blockToMoveInfo.sourceColumn === "blocks") {
                    newAvailableBlocks = newAvailableBlocks.filter(
                      (b) => b.id !== sourceBlockData.id
                    );
                    if (blockToSwapOut) newAvailableBlocks.push(blockToSwapOut);
                  } else {
                    tempWorkspace[blockToMoveInfo.sourceIndex] = blockToSwapOut;
                  }
                }
                onWorkspaceChange(tempWorkspace);

                if (blockToMoveInfo.sourceColumn === "blocks") {
                  console.log(
                    "Need to update available blocks after move from blocks to workspace"
                  );
                }
              } else {
                tempWorkspace[blockToMoveInfo.sourceIndex] = null;
                onWorkspaceChange(tempWorkspace);

                if (ghostTargetInfo.targetBlockId) {
                  const targetIdxInAvailable = newAvailableBlocks.findIndex(
                    (b) => b.id === ghostTargetInfo.targetBlockId
                  );
                  if (targetIdxInAvailable !== -1) {
                    newAvailableBlocks[targetIdxInAvailable] = sourceBlockData;
                    console.warn(
                      "Swap logic for item from workspace to available list needs careful implementation"
                    );
                  }
                } else {
                  if (
                    !newAvailableBlocks.find((b) => b.id === sourceBlockData.id)
                  ) {
                    newAvailableBlocks.push(sourceBlockData);
                  }
                }
                console.log(
                  "Need to update available blocks after move from workspace to blocks"
                );
              }

              const nextActiveCol = blockToMoveInfo.sourceColumn;
              let nextIndexInSource = blockToMoveInfo.sourceIndex;
              let sourceListAfterMoveDense: Block[];

              if (blockToMoveInfo.sourceColumn === "blocks") {
                sourceListAfterMoveDense = newAvailableBlocks;
              } else {
                sourceListAfterMoveDense = tempWorkspace.filter(
                  Boolean
                ) as Block[];
              }

              if (
                nextIndexInSource >= sourceListAfterMoveDense.length &&
                sourceListAfterMoveDense.length > 0
              ) {
                nextIndexInSource = sourceListAfterMoveDense.length - 1;
              }

              setBlockToMoveInfo(null);
              setGhostTargetInfo(null);
              setActiveColumn(nextActiveCol);

              if (
                sourceListAfterMoveDense.length > 0 &&
                sourceListAfterMoveDense[nextIndexInSource]
              ) {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(sourceListAfterMoveDense[nextIndexInSource]);
              } else if (sourceListAfterMoveDense.length > 0) {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(sourceListAfterMoveDense[0]);
              } else {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(null);
              }
            }
          }
          break;
        default:
          return;
      }

      if (
        denseCurrentList.length > 0 &&
        newIndex !== currentIndexInList &&
        event.key !== "e" &&
        event.key !== "E" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight"
      ) {
        setIndices((prev) => ({ ...prev, [activeColumn]: newIndex }));
        if (denseCurrentList[newIndex]) {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(denseCurrentList[newIndex]);
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
      blockToMoveInfo,
      setBlockToMoveInfo,
      ghostTargetInfo,
      setGhostTargetInfo,
      maxBlocks,
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
