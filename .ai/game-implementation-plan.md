# Plan implementacji widoku Code Blocks

## 1. Przegląd

Code Blocks to edukacyjna gra logiczna bazująca na mechanice Mastermind, implementująca interfejs blokowy do nauki programowania. Widok gry składa się z trzech głównych sekcji: listy dostępnych bloków, przestrzeni roboczej oraz terminala z efektami retro.

## 2. Routing widoku

- `/game` - podstawowy widok gry
- `/game/:levelId` - widok konkretnego poziomu (parametry w URL)
- `/editor` - widok edytora poziomów

## 3. Struktura komponentów

```
GameLayout
├── Header
│   ├── LevelInfo
│   └── Controls
├── MainContent
│   ├── BlockList
│   ├── WorkspaceArea
│   └── InfoPanel
└── Terminal
```

## 4. Szczegóły komponentów

### GameLayout

- Opis: Główny kontener aplikacji, zarządza layoutem i podziałem na sekcje
- Główne elementy: Header, MainContent, Terminal
- Obsługiwane interakcje: Brak
- Propsy:
  ```typescript
  interface GameLayoutProps {
    children: ReactNode;
    isCompiling: boolean;
  }
  ```

### BlockList

- Opis: Lista dostępnych bloków funkcyjnych
- Główne elementy: Lista BlockComponent, system wyszukiwania
- Obsługiwane interakcje:
  - Wybór bloku (klik/klawiatura)
  - Przeciąganie bloków
  - Nawigacja klawiaturą (↑/↓)
- Propsy:
  ```typescript
  interface BlockListProps {
    blocks: Block[];
    onBlockSelect: (block: Block) => void;
    selectedBlockId: string | null;
  }
  ```

### WorkspaceArea

- Opis: Przestrzeń do układania sekwencji bloków
- Główne elementy: DragDropContext, lista BlockComponent
- Obsługiwane interakcje:
  - Upuszczanie bloków
  - Zmiana kolejności
  - Usuwanie bloków
- Walidacja:
  - Maksymalna liczba bloków
  - Unikalne bloki
- Propsy:
  ```typescript
  interface WorkspaceAreaProps {
    workspace: Block[];
    onWorkspaceChange: (blocks: Block[]) => void;
    maxBlocks: number;
  }
  ```

### Terminal

- Opis: Wyświetla feedback kompilacji i animacje
- Główne elementy: CompilationAnimation, StatusDisplay
- Obsługiwane interakcje:
  - Start kompilacji
  - Reset stanu
- Propsy:
  ```typescript
  interface TerminalProps {
    isCompiling: boolean;
    errors: number;
    onReset: () => void;
  }
  ```

## 5. Typy

```typescript
interface Block {
  id: string;
  name: string;
  description: string;
  type: BlockType;
  icon?: string;
}

interface GameState {
  blocks: Block[];
  workspace: Block[];
  selectedBlock: string | null;
  isCompiling: boolean;
  errors: number;
}

interface LevelConfig {
  requiredBlocks: number;
  availableBlocks: string[];
  solution: string[];
  hint?: string;
}

type BlockType = "function" | "condition" | "loop" | "variable" | "operator";
```

## 6. Zarządzanie stanem

### Custom Hooks

#### useGameState

```typescript
const useGameState = (levelConfig: LevelConfig) => {
  // Zarządzanie stanem gry
  return {
    gameState,
    actions: { moveBlock, removeBlock, resetGame, startCompilation },
  };
};
```

#### useKeyboardNavigation

```typescript
const useKeyboardNavigation = (refs: RefMap) => {
  // Logika nawigacji klawiaturą
  return {
    selectedId,
    handleKeyDown,
    setFocus,
  };
};
```

## 7. Interakcje użytkownika

1. Wybór bloku:

   - Klik myszką
   - Nawigacja strzałkami + Enter
   - Przeciągnięcie do workspace

2. Manipulacja workspace:

   - Drag & drop między kolumnami
   - Zmiana kolejności bloków
   - Usuwanie bloków (Backspace/Delete)

3. Kompilacja:
   - Przycisk "Kompiluj"
   - Skrót klawiszowy (Ctrl+Enter)

## 8. Warunki i walidacja

1. Workspace:

   - Maksymalna liczba bloków
   - Unikalne bloki
   - Kompletność sekwencji

2. Kompilacja:
   - Wszystkie wymagane bloki użyte
   - Poprawna kolejność
   - Brak duplikatów

## 10. Kroki implementacji

1. Setup projektu:

   - Inicjalizacja projektu Vite
   - Konfiguracja TypeScript
   - Instalacja zależności (dnd-kit, Framer Motion)

2. Implementacja podstawowego layoutu:

   - GameLayout
   - Trzy kolumny
   - Terminal

3. Implementacja komponentów bloków:

   - BlockComponent
   - BlockList
   - Drag & Drop

4. System nawigacji klawiaturowej:

   - useKeyboardNavigation
   - Obsługa zdarzeń
   - Wizualne wskaźniki fokusa

5. Logika gry:

   - useGameState
   - Walidacja sekwencji
   - System kompilacji

6. Terminal i animacje:

   - CompilationAnimation
   - Efekty Matrix
   - Feedback błędów

7. System URL:

   - Generowanie linków
   - Parsowanie parametrów
   - Walidacja danych
