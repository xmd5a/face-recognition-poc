# Podsumowanie Architektury UI

## 1. Struktura Aplikacji

```
src/
  components/
    blocks/
      Block.tsx
      BlockList.tsx
      BlockWorkspace.tsx
    terminal/
      Terminal.tsx
      CompilationAnimation.tsx
    layout/
      GameLayout.tsx
      EditorLayout.tsx
    ui/
      [shadcn-components]
  context/
    GameContext.tsx
    ConfigContext.tsx
  routes/
    Game.tsx
    Editor.tsx
  types/
    blocks.ts
    game.ts
  utils/
    urlParser.ts
    validation.ts
```

## 2. Kluczowe Elementy

### Zarządzanie Stanem

- React Context jako główne rozwiązanie do zarządzania stanem
- Dwa główne konteksty:

  ```typescript
  // GameContext - stan gry
  interface GameState {
    blocks: Block[];
    workspace: Block[];
    scenario: ScenarioConfig;
    isCompiling: boolean;
    errors: number;
  }

  // ConfigContext - konfiguracja gry
  interface ConfigState {
    availableBlocks: Block[];
    scenarioConfig: ScenarioConfig;
    terminalConfig: TerminalConfig;
  }
  ```

### System Routingu

```typescript
/                   // Strona główna/wybór trybu
/game              // Tryb gry
/editor            // Edytor poziomów
```

### Efekty Wizualne

```css
.terminal {
  background: #1a1a1a;
  color: #00ff00;
  font-family: "Fira Code", monospace;
  position: relative;
  overflow: hidden;
}

/* Zaawansowane efekty CRT */
.terminal::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
    linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
  animation: flicker 0.15s infinite;
}

/* Scanline effect */
.terminal::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 255, 0, 0.15) 0px,
    rgba(0, 255, 0, 0) 1px,
    rgba(0, 255, 0, 0) 2px
  );
  pointer-events: none;
  animation: scan 7.5s linear infinite;
}
```

### Interakcje

- dnd-kit dla operacji drag-and-drop
- Framer Motion dla animacji kompilacji i efektów Matrix

### Layout

```css
.game-layout {
  display: grid;
  grid-template-rows: 70vh 30vh;
  height: 100vh;
  width: 100vw;
}

.editor-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
}
```

## 3. Technologie

- React + TypeScript
- Shadcn/ui dla komponentów bazowych
- Framer Motion dla animacji
- dnd-kit dla drag-and-drop
- TailwindCSS dla stylowania

## 4. Kluczowe Funkcjonalności

1. System bloków funkcyjnych z drag-and-drop
2. Retro terminal z efektami wizualnymi
3. Edytor poziomów z generowaniem URL
4. System kompilacji z animacjami
5. Podwójny system sterowania (mysz + klawiatura)

Ta architektura zapewnia solidną podstawę dla MVP, z możliwością łatwego rozszerzania funkcjonalności w przyszłości. Skupia się na kluczowych elementach wymaganych w PRD, jednocześnie zachowując prostotę i modularność kodu.
