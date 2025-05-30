import { useCallback } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import BlockComponent, { type BlockProps } from "./BlockComponent";

export interface Block {
  id: string;
  name: string;
  description: string;
}

interface BlockListProps {
  blocks: Block[];
  onBlockSelect: (block: Block) => void;
  selectedBlockId: string | null;
}

const BlockList = ({
  blocks,
  onBlockSelect,
  selectedBlockId,
}: BlockListProps) => {
  const handleSelect = useCallback(
    (block: Block) => {
      onBlockSelect(block);
    },
    [onBlockSelect]
  );

  return (
    <div className="h-full overflow-y-auto p-4 bg-black/30 rounded-lg">
      <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
        {blocks.map((block) => {
          const blockProps: Omit<BlockProps, "children"> = {
            ...block,
            isSelected: block.id === selectedBlockId,
            onSelect: () => handleSelect(block),
          };
          return <BlockComponent key={block.id} {...blockProps} />;
        })}
      </SortableContext>
    </div>
  );
};

export default BlockList;
