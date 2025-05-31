interface HeaderProps {
  levelInfo: {
    title: string;
    requiredBlocks: number;
    currentBlocks: number;
  };
}

const Header = ({ levelInfo }: HeaderProps) => {
  return (
    <header className="p-4 border border-white/10 border-b-0 bg-neutral-800">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold terminal-text">{levelInfo.title}</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
