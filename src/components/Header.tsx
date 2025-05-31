interface HeaderProps {
  levelInfo: {
    title: string;
    requiredBlocks: number;
    currentBlocks: number;
  };
}

const Header = ({ levelInfo }: HeaderProps) => {
  return (
    <header className="p-4 border-b border-terminal-green/20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold terminal-text">{levelInfo.title}</h1>
          <div className="text-sm opacity-70">
            Blocks: {levelInfo.currentBlocks}/{levelInfo.requiredBlocks}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <kbd className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/20 rounded">
            ↑/↓
          </kbd>
          <span className="text-xs opacity-70">Select</span>

          <kbd className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/20 rounded ml-4">
            ←/→
          </kbd>
          <span className="text-xs opacity-70">Move</span>

          <kbd className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/20 rounded ml-4">
            Enter
          </kbd>
          <span className="text-xs opacity-70">Compile</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
