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
  onAvailableBlocksChange: (blocks: Block[]) => void;
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
  onAvailableBlocksChange,
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
      if (ghostTargetInfo && ghostTargetInfo.targetColumn === activeColumn) {
        if (
          !ghostTargetInfo.isTargetPlaceholder &&
          ghostTargetInfo.targetBlockId
        ) {
          const denseList =
            activeColumn === "workspace"
              ? (workspace.filter(Boolean) as Block[])
              : availableBlocks;
          const blockToSelect = denseList.find(
            (b) => b.id === ghostTargetInfo.targetBlockId
          );
          if (selectedBlockId !== (blockToSelect?.id || null)) {
            blockSelectionTriggeredByHook.current = true;
            onBlockSelect(blockToSelect || null);
          }
        } else if (ghostTargetInfo.isTargetPlaceholder) {
          if (selectedBlockId !== null) {
            blockSelectionTriggeredByHook.current = true;
            onBlockSelect(null);
          }
        }
      } else {
        const denseTargetListForSelection =
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
          } else {
            const denseWorkspace = workspace.filter(Boolean) as Block[];
            if (denseWorkspace.length > 0) {
              let currentDenseIndex = indices.workspace;
              if (
                currentDenseIndex >= denseWorkspace.length ||
                currentDenseIndex < 0
              ) {
                currentDenseIndex = 0;
              }
              const targetedBlock = denseWorkspace[currentDenseIndex];
              if (targetedBlock) {
                targetBlockEntityId = targetedBlock.id;
                const rawIndex = workspace.findIndex(
                  (b) => b?.id === targetedBlock.id
                );
                if (rawIndex !== -1) {
                  foundTargetIndex = rawIndex;
                } else {
                  foundTargetIndex = -1;
                }
              } else {
                foundTargetIndex = -1;
              }
              isPlaceholderTarget = false;
            }
          }
        } else {
          if (availableBlocks.length > 0) {
            let currentBlocksIndex = indices.blocks;
            if (
              currentBlocksIndex >= availableBlocks.length ||
              currentBlocksIndex < 0
            ) {
              currentBlocksIndex = 0;
            }
            foundTargetIndex = currentBlocksIndex;
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
          if (!isPlaceholderTarget && targetBlockEntityId) {
            const blockToSelect = denseTargetListForSelection.find(
              (b) => b.id === targetBlockEntityId
            );
            onBlockSelect(blockToSelect || null);
          } else if (isPlaceholderTarget) {
            onBlockSelect(null);
          }
        } else {
          setGhostTargetInfo(null);
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(null);
        }
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

    const currentDenseList =
      activeColumn === "blocks"
        ? availableBlocks
        : (workspace.filter(Boolean) as Block[]);
    let newIndexToSelect = indices[activeColumn];

    const globalSelectedBlockInCurrentDenseList = currentDenseList.find(
      (b) => b.id === selectedBlockId
    );

    if (globalSelectedBlockInCurrentDenseList) {
      const idxOfGlobalSelection = currentDenseList.findIndex(
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
      if (currentDenseList.length > 0) {
        if (
          newIndexToSelect >= currentDenseList.length ||
          newIndexToSelect < 0
        ) {
          newIndexToSelect = 0;
        }
        setIndices((prev) => ({ ...prev, [activeColumn]: newIndexToSelect }));
        if (currentDenseList[newIndexToSelect]) {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(currentDenseList[newIndexToSelect]);
        } else {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(null);
        }
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
    onAvailableBlocksChange,
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

      let currentIndexInDenseList = indices[activeColumn];

      if (
        currentIndexInDenseList >= denseCurrentList.length &&
        denseCurrentList.length > 0
      ) {
        currentIndexInDenseList = denseCurrentList.length - 1;
      }
      if (denseCurrentList.length === 0) {
        currentIndexInDenseList = 0;
      }

      if (keyboardNavJustActivated && selectedBlockId) {
        const indexFromSelection = denseCurrentList.findIndex(
          (b) => b.id === selectedBlockId
        );
        if (indexFromSelection !== -1) {
          currentIndexInDenseList = indexFromSelection;
        }
        setKeyboardNavJustActivated(false);
      }

      let newDenseIndex = currentIndexInDenseList;
      const maxDenseIndex =
        denseCurrentList.length > 0 ? denseCurrentList.length - 1 : 0;

      if (
        blockToMoveInfo &&
        activeColumn === blockToMoveInfo.sourceColumn &&
        (event.key === "ArrowUp" || event.key === "ArrowDown")
      ) {
        event.preventDefault();
        return;
      }

      if (
        blockToMoveInfo &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        event.preventDefault();
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
          event.preventDefault();
          if (blockToMoveInfo && activeColumn === "workspace") {
            const currentTargetSlotIndex =
              ghostTargetInfo?.targetColumn === "workspace"
                ? ghostTargetInfo.targetIndex
                : 0;
            let newTargetSlotIndex = currentTargetSlotIndex;

            if (event.key === "ArrowUp") {
              newTargetSlotIndex =
                currentTargetSlotIndex > 0
                  ? currentTargetSlotIndex - 1
                  : maxBlocks - 1;
            } else {
              // ArrowDown
              newTargetSlotIndex =
                currentTargetSlotIndex < maxBlocks - 1
                  ? currentTargetSlotIndex + 1
                  : 0;
            }

            if (newTargetSlotIndex !== currentTargetSlotIndex) {
              const newTargetIsPlaceholder =
                workspace[newTargetSlotIndex] === null;
              const newTargetBlock = workspace[newTargetSlotIndex];

              setGhostTargetInfo({
                targetColumn: "workspace",
                targetIndex: newTargetSlotIndex,
                isTargetPlaceholder: newTargetIsPlaceholder,
                targetBlockId: newTargetIsPlaceholder
                  ? null
                  : newTargetBlock?.id || null,
              });
              // useEffect will handle onBlockSelect based on new ghostTargetInfo
            }
            return; // Handled special navigation for workspace in move mode
          }

          // Standard navigation if not in move mode targeting workspace
          if (denseCurrentList.length > 0) {
            if (event.key === "ArrowUp") {
              newDenseIndex =
                currentIndexInDenseList > 0
                  ? currentIndexInDenseList - 1
                  : maxDenseIndex;
            } else {
              // ArrowDown
              newDenseIndex =
                currentIndexInDenseList < maxDenseIndex
                  ? currentIndexInDenseList + 1
                  : 0;
            }
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
            const sourceListForIndex =
              originalSourceColumn === "blocks"
                ? availableBlocks
                : (workspace.filter(Boolean) as Block[]);
            const originalBlockIndex = sourceListForIndex.findIndex(
              (b) => b.id === originalBlockToSelect.id
            );
            if (originalBlockIndex !== -1) {
              setIndices((prev) => ({
                ...prev,
                [originalSourceColumn]: originalBlockIndex,
              }));
            }
          }
          break;
        case "e":
        case "E":
          event.preventDefault();
          if (!blockToMoveInfo) {
            const blockToInitiateMove =
              denseCurrentList[currentIndexInDenseList];
            if (blockToInitiateMove) {
              let rawSourceIndex = -1;
              if (activeColumn === "workspace") {
                rawSourceIndex = workspace.findIndex(
                  (b) => b?.id === blockToInitiateMove.id
                );
              } else {
                rawSourceIndex = currentIndexInDenseList;
              }

              if (activeColumn === "workspace" && rawSourceIndex === -1) {
                console.error(
                  "Error: Could not find block in raw workspace to determine sourceIndex."
                );
                return;
              }

              setBlockToMoveInfo({
                id: blockToInitiateMove.id,
                sourceColumn: activeColumn,
                sourceData: blockToInitiateMove,
                sourceIndex: rawSourceIndex,
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
                  onAvailableBlocksChange(newAvailableBlocks);
                }
              } else {
                if (blockToMoveInfo.sourceColumn !== "workspace") {
                  console.error(
                    "Invalid state: To move to Available Blocks, source must be Workspace."
                  );
                  setBlockToMoveInfo(null);
                  setGhostTargetInfo(null);
                  return;
                }
                tempWorkspace[blockToMoveInfo.sourceIndex] = null;
                onWorkspaceChange(tempWorkspace);

                if (ghostTargetInfo.targetBlockId) {
                  const targetIdxInAvailable = ghostTargetInfo.targetIndex;
                  if (
                    targetIdxInAvailable !== -1 &&
                    targetIdxInAvailable < newAvailableBlocks.length
                  ) {
                    newAvailableBlocks[targetIdxInAvailable] = sourceBlockData;
                  } else {
                    newAvailableBlocks.push(sourceBlockData);
                  }
                } else {
                  if (
                    !newAvailableBlocks.find((b) => b.id === sourceBlockData.id)
                  ) {
                    newAvailableBlocks.push(sourceBlockData);
                  }
                }
                onAvailableBlocksChange(newAvailableBlocks);
              }

              const nextActiveCol = blockToMoveInfo.sourceColumn;
              let nextSourceIndexAfterMove: number;

              let denseSourceListAfterMove: Block[];
              if (nextActiveCol === "blocks") {
                denseSourceListAfterMove = newAvailableBlocks;
                nextSourceIndexAfterMove = Math.min(
                  blockToMoveInfo.sourceIndex,
                  denseSourceListAfterMove.length - 1
                );
                if (denseSourceListAfterMove.length === 0)
                  nextSourceIndexAfterMove = 0;
              } else {
                denseSourceListAfterMove = tempWorkspace.filter(
                  Boolean
                ) as Block[];

                const originalSourceBlockId = blockToMoveInfo.id;
                const itemNowAtOriginalRawSourceIndex =
                  tempWorkspace[blockToMoveInfo.sourceIndex];

                if (
                  itemNowAtOriginalRawSourceIndex &&
                  itemNowAtOriginalRawSourceIndex.id !== originalSourceBlockId
                ) {
                  nextSourceIndexAfterMove = denseSourceListAfterMove.findIndex(
                    (b) => b.id === itemNowAtOriginalRawSourceIndex.id
                  );
                } else if (denseSourceListAfterMove.length > 0) {
                  let potentialIndex = indices.workspace;
                  if (potentialIndex >= denseSourceListAfterMove.length) {
                    potentialIndex = denseSourceListAfterMove.length - 1;
                  }
                  nextSourceIndexAfterMove = potentialIndex;
                } else {
                  nextSourceIndexAfterMove = 0;
                }

                if (
                  nextSourceIndexAfterMove >= denseSourceListAfterMove.length &&
                  denseSourceListAfterMove.length > 0
                ) {
                  nextSourceIndexAfterMove =
                    denseSourceListAfterMove.length - 1;
                }
                if (denseSourceListAfterMove.length === 0)
                  nextSourceIndexAfterMove = 0;
              }

              setBlockToMoveInfo(null);
              setGhostTargetInfo(null);
              setActiveColumn(nextActiveCol);
              setIndices((prev) => ({
                ...prev,
                [nextActiveCol]: nextSourceIndexAfterMove,
              }));

              if (
                denseSourceListAfterMove.length > 0 &&
                denseSourceListAfterMove[nextSourceIndexAfterMove]
              ) {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(
                  denseSourceListAfterMove[nextSourceIndexAfterMove]
                );
              } else {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(null);
              }
            }
          }
          break;
        default:
          // No operation for other keys in the switch itself, but don't return prematurely.
          break;
      }

      // After the switch, if ArrowUp or ArrowDown was pressed and newDenseIndex is different,
      // update the state.
      if (
        (event.key === "ArrowUp" || event.key === "ArrowDown") &&
        denseCurrentList.length > 0 &&
        newDenseIndex !== currentIndexInDenseList
      ) {
        setIndices((prev) => ({ ...prev, [activeColumn]: newDenseIndex }));
        if (denseCurrentList[newDenseIndex]) {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(denseCurrentList[newDenseIndex]);
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
      onAvailableBlocksChange,
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
