# Code Blocks - Extended Project Description

## Overview

Code Blocks is an educational game that simulates programming concepts through a block-based interface. Players arrange function blocks in the correct sequence to complete various programming scenarios. The game features a retro terminal aesthetic with modern interaction patterns.

## Core Game Mechanics

### Block System

- Total of 30 predefined function blocks
- Each block represents a high-level programming concept
- Blocks can only be used once per scenario
- Blocks must be arranged in the correct sequence

### Game Logic

- The game simulates pseudo-programming through sequential block arrangement
- Each level requires arranging X blocks from a pool of Y available blocks
  - X (required blocks) and Y (available blocks) are configurable per level
  - Both X and Y are encoded in the level URL for easy sharing
  - Minimum 3 blocks required per level
  - Maximum blocks equals the available pool size
- Block Usage Rules:
  - Each block can be used only once per scenario
  - Blocks must form a logical sequence of operations
  - No visual hints about incorrect block placement
  - Players must deduce the correct sequence through trial and error

### Level Completion

1. Player arranges blocks in the middle column
2. Compilation process can be manually triggered by clicking the "compile" button when all required blocks are placed
3. Success Scenario:
   - System displays "0 błędów, przystępuję do kompilacji"
   - Matrix-style animation plays for 10 seconds
   - Final message: "kompilacja zakończona sukcesem"
4. Failure Scenario:
   - System displays "X błędów, sprawdź swój kod"
   - No indication which blocks are incorrect
   - Player must deduce errors through logical reasoning

### Level Generation

- Levels are defined by:
  - Available block pool (subset of 30 blocks)
  - Required number of blocks
  - Correct sequence order
  - Scenario hint text
- Level parameters are encoded in URL for sharing
- No persistent storage of level data
- Deterministic level recreation from URL parameters

### Block Structure

```typescript
interface Block {
  id: string; // Unique identifier
  name: string; // Function name (e.g., "loadImage()")
  description: string; // Short description
}
```

### Example Blocks

```typescript
const exampleBlocks = [
  { id: "1", name: "loadImage()", description: "wgrywa zdjęcie." },
  {
    id: "2",
    name: "resizeImage()",
    description: "skaluje zdjęcie do standardowego formatu.",
  },
  { id: "3", name: "detectFace()", description: "wykrywa twarz." },
  {
    id: "4",
    name: "extractFeatures()",
    description: "wyciąga cechy twarzy (embedding).",
  },
  {
    id: "5",
    name: "compareWithDatabase()",
    description: "porównuje z bazą znanych twarzy.",
  },
  { id: "6", name: "getIdentity()", description: "określa tożsamość." },
  { id: "7", name: "logResult()", description: "zapisuje wynik do logu." },
  {
    id: "8",
    name: "displayResult()",
    description: "wyświetla wynik identyfikacji",
  },
];
```

### Additional Function Blocks

```typescript
const additionalBlocks = [
  {
    id: "16",
    name: "createBackup()",
    description: "Tworzy kopię zapasową danych",
  },
  { id: "17", name: "validateFormat()", description: "Sprawdza format pliku" },
  { id: "18", name: "compressData()", description: "Kompresuje dane" },
  { id: "19", name: "encryptData()", description: "Szyfruje dane" },
  { id: "20", name: "sendNotification()", description: "Wysyła powiadomienie" },
  { id: "21", name: "generateReport()", description: "Generuje raport" },
  { id: "22", name: "cleanupTemp()", description: "Czyści pliki tymczasowe" },
  {
    id: "23",
    name: "optimizeMemory()",
    description: "Optymalizuje użycie pamięci",
  },
  {
    id: "24",
    name: "verifyChecksum()",
    description: "Weryfikuje sumę kontrolną",
  },
  {
    id: "25",
    name: "parseConfig()",
    description: "Parsuje plik konfiguracyjny",
  },
  { id: "26", name: "initDatabase()", description: "Inicjalizuje bazę danych" },
  {
    id: "27",
    name: "validatePermissions()",
    description: "Sprawdza uprawnienia",
  },
  { id: "28", name: "createIndex()", description: "Tworzy indeks" },
  { id: "29", name: "optimizeQuery()", description: "Optymalizuje zapytanie" },
  { id: "30", name: "handleError()", description: "Obsługuje błędy" },
];
```

## User Interface

### Layout Structure

- Screen divided into two main sections:
  1. Main Editor (70% height)
     - Left Column (30%): Available blocks
     - Middle Column (30%): Workspace for arranged blocks
     - Right Column (30%): Split into:
       - Top: Scenario hint in markdown
       - Bottom: Selected block description
  2. Terminal View (30% height)
     - Compilation button
     - Status messages
     - Matrix animation during compilation

### Visual Style

- Dark theme background (#1A1A1A)
- Terminal green accents (#00FF00)
- CRT effect overlay (covers entire screen)
- Scanlines effect (15% opacity, animated)
- Monospace font (Fira Code or Source Code Pro)
- Subtle flicker effect on terminal

### Interactive Elements

- Blocks:
  - Hover state with subtle highlight
  - Selected state with green background and white text
  - Glow effect on selected block (subtle pulse animation)
- Active column:
  - Subtle highlight
  - Border glow effect
- Compile button:
  - Always visible
  - Active only when all required blocks are placed
  - Terminal-style design

## Controls

### Dual Input System

1. Mouse Controls:

   - Drag and drop blocks between columns
   - Hover effects for selection
   - Click to select blocks

2. Keyboard Navigation:
   - ↑/↓: Select block in current column
   - ←/→: Switch between columns
   - E: Move block to/from workspace
   - Enter: Trigger compilation

### Control Legend

```
[↑/↓] Wybór bloku | [←/→] Zmiana kolumny | [E] Przenieś blok | [Enter] Compile
```

## Scenarios

### Structure

```typescript
interface Scenario {
  id: string; // Unique identifier
  blocks: string[]; // Available block IDs
  solution: string[]; // Correct sequence
  requiredCount: number; // Number of blocks needed
  hint: string; // Player hint
}
```

### Example Scenarios

1. Face Recognition Pipeline

   - 8 blocks
   - Full image processing sequence
   - Focus on computer vision concepts

2. Data Backup Process

   - 5 blocks
   - Data validation and storage
   - Focus on data safety

3. Database Optimization
   - 5 blocks
   - Database management sequence
   - Focus on performance optimization

## Level Editor

### Features

- Simple one-screen interface
- Block selection from predefined pool
- Required block count setting (minimum 3, maximum = pool size)
- Solution sequence definition
- Link generation for sharing
- No preview functionality
- No level naming or saving capability

### Editor Interface

- Single screen form layout
- Input fields:
  1. Block pool selection
  2. Required block count
  3. Correct sequence order
  4. Predefined scenario hint selection
- "Generate Link" button for creating shareable URL

### URL Structure

```typescript
interface LevelParams {
  sid: string; // Scenario identifier
  blocks: string; // Base64 encoded available blocks array
  solution: string; // Base64 encoded correct sequence
  required: number; // Number of required blocks
}

// Example URL structure:
// /game?sid=face_recognition&blocks=BASE64_BLOCKS&solution=BASE64_SOLUTION&required=5

// Notes:
// - No compression in MVP
// - Solution encoding should not be easily readable
// - Parameters must allow deterministic level recreation
// - URL parameters preserve all level rules and constraints
```

### Level Sharing

- Generated URL contains all necessary level information
- No server-side storage required
- Levels can be shared and loaded without registration
- URL parameters are encoded but not encrypted in MVP

## Feedback System

### Compilation Process

1. Success:

   - "0 błędów, przystępuję do kompilacji"
   - 10-second Matrix-style animation
   - "kompilacja zakończona sukcesem"

2. Failure:
   - "X błędów, sprawdź swój kod"
   - No indication of error location
   - Player must deduce the correct sequence

## Technical Constraints (MVP)

### Included

- Desktop browser support
- Offline functionality
- Base64 encoding for level sharing
- Keyboard and mouse controls
- CRT and terminal effects

### Excluded

- Mobile support
- Sound effects
- Tutorial system
- Progress saving
- Difficulty levels
- Score system
- Time limits

## Animation Specifications

### Transitions

- Block movement: 200-300ms duration
- State changes: Smooth transitions
- Matrix animation: Classic green style
- CRT effect: Constant scanlines
- Selection glow: Subtle pulse effect

### Terminal Effects

- Matrix animation during compilation
- Scanlines overlay
- Subtle screen flicker
- Text glow on active elements

## Future Considerations

While not part of MVP, the following features could be considered for future versions:

- Multiple difficulty levels
- Score tracking system
- Sound effects and audio feedback
- Tutorial system
- Mobile responsiveness
- User accounts and progress saving
- Community-created levels
- Achievement system
