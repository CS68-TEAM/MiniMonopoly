# Class Diagram 
โครงสร้างของระบบ Mini Monopoly และความสัมพันธ์ระหว่างคลาสหลัก โดยแบ่งองค์ประกอบออกดังนี้

- **Game** - จัดการกติกาและสถานะหลักของเกม เช่น การเดิน การซื้อทรัพย์สิน การ Takeover และการตรวจสอบผู้ชนะ
- **Board / Tile / Property** - จัดการกระดาน ช่องบนกระดาน และทรัพย์สินภายในเกม
- **Player** - เก็บข้อมูลผู้เล่น เงิน ตำแหน่ง สถานะ และทรัพย์สินที่ครอบครอง
- **EasyAI / NormalAI / HardAI** - จัดการการตัดสินใจของบอทแต่ละระดับ
- **App และ View ต่าง ๆ** - จัดการส่วนติดต่อผู้ใช้และการแสดงผลใน Terminal
- **Chance / ChanceCard** - จัดการระบบการ์ดเหตุการณ์ภายในเกม
- **Board32 / TileDef** - เก็บข้อมูลและโครงสร้างของกระดาน 32 ช่อง
- **SaveData / SoundManager** - จัดการข้อมูลการบันทึกเกมและระบบเสียง

---

```mermaid
classDiagram
direction LR

class Game {
    +board: Board
    +players: Player[]
    +currentPlayerIndex: number
    +status: GameStatus
    +winner: Player
    +lastDice: number
    +pendingProperty: Property
    +pendingTakeover: Property
    +pendingDebt: boolean
    +currentPlayer() Player
    +activePlayers() Player[]
    +move(player, bail) number
    +roll(player, bail) number
    +land() void
    +buy(player) boolean
    +sellProperty(player, id) boolean
    +takeOver(buyer, id, offer) boolean
    +nextTurn()
    +checkWinner() Player
    +declareBankruptcy()
}

class Board {
    +tiles: Tile[]
    +getTile(position) Tile
    +findPropertyById(id) Property
}

class Player {
    +id: string
    +name: string
    +kind: PlayerKind
    +money: number
    +position: number
    +status: PlayerStatus
    +properties: Property[]
    +purchaseCount: number
    +takeoverCount: number
    +addMoney(amount)
    +removeMoney(amount)
    +addProperty(property)
    +removeProperty(property)
}

class Property {
    +id: number
    +name: string
    +price: number
    +rent: number
    +owner: PlayerRef
    +isOwned() boolean
}

class Tile {
    +index: number
    +name: string
    +type: TileType
    +property: Property
    +amount: number
    +color: TileColor
}

class PlayerRef {
    +id: string
    +name: string
}


class EasyAI {
    +player: Player
    +move(game) number
    +resolve(game)
}

class NormalAI {
    +player: Player
    +move(game) number
    +resolve(game)
}

class HardAI {
    +player: Player
    +move(game) number
    +resolve(game)
}


class App {
    -screen
    -game: Game
    -ais: AI[]
    -busy: boolean
    -testMode: boolean
    +run() void
    -startGame()
    -doRoll()
    -resolveTurn()
    -render()
    -autoSave()
}

class BoardView {
    +box
    +render(board, players, overrides)
}

class PlayerView {
    +box
    +render(players, currentPlayerId)
}

class PropertyInfo {
    +box
    +render(board, players, humanId)
}

class GameLog {
    +box
    +add(message)
    +scroll(delta)
}

class ActionMenu {
    +box
    +setTestMode(on)
}

class DiceView {
    +box
    +render(value, settled)
    +animateRoll(final, onFrame) Promise
}

class WinnerView {
    +buildWinnerContentLines(winner)
    +buildWinnerFooterContent()
    +buildFullScreenLines(winner)
}

class Chance {
    +pickChanceEvent(random) ChanceCard
}

class ChanceCard {
    +title: string
    +description: string
    +apply(player, ctx) string
}

class ChanceContext {
    +move(player, steps)
    +payTax(player, amount)
}

class Board32 {
    +BOARD_32: TileDef[]
    +COLOR_TIERS
}

class TileDef {
    +index: number
    +type: TileType
    +name: string
    +price: number
    +rent: number
    +isCorner: boolean
    +color: TileColor
}

class SaveData {
    +currentPlayer: string
    +players: unknown[]
    +savedAt: string
}

class SoundManager {
    +SOUNDS
    +playSound(file) Promise
    +stopSound()
    +closeSoundManager()
}

Game *-- Board
Game o-- "4" Player
Board *-- "32" Tile
Tile o-- "0..1" Property
Player o-- "0..5" Property
Property --> "0..1" PlayerRef

Board ..> Board32
Board32 ..> TileDef

Game ..> Chance
Chance ..> ChanceCard
ChanceCard ..> ChanceContext
Game ..> ChanceContext

EasyAI --> Player
NormalAI --> Player
HardAI --> Player

EasyAI ..> Game
NormalAI ..> Game
HardAI ..> Game

App *-- Game
App o-- EasyAI
App o-- NormalAI
App o-- HardAI

App *-- BoardView
App *-- PlayerView
App *-- PropertyInfo
App *-- GameLog
App *-- ActionMenu
App *-- DiceView
App ..> WinnerView
App ..> SaveData
App ..> SoundManager

BoardView ..> Board
PlayerView ..> Player
PropertyInfo ..> Board
PropertyInfo ..> Player
DiceView ..> SoundManager
WinnerView ..> Player

Game ..> SoundManager
```
---

<img width="8192" height="7372" alt="diagram" src="https://github.com/user-attachments/assets/01d89796-3bf8-49cf-921c-d751e306fce0" />