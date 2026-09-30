# Architecture

เอกสารนี้อธิบายว่าระบบแบ่ง layer ยังไง แต่ละ layer ทำหน้าที่อะไร และ turn หนึ่งของเกมไหลผ่านโค้ดตรงไหนบ้าง

```
MiniMonopoly/
│
├── assets/
│   ├── 1.wav
│   ├── 2.wav
│   ├── 3.wav
│   ├── 4.wav
│   ├── 5.wav
│   ├── 6.wav
│   ├── buy.wav
│   ├── chance.wav
│   ├── diceroll.wav
│   ├── jail.wav
│   ├── lost.wav
│   ├── move.wav
│   ├── noprop.wav
│   ├── payrent.wav
│   ├── receivedmoney.wav
│   ├── round.wav
│   ├── sadjung.wav
│   ├── start.wav
│   ├── takeover.wav
│   ├── win.wav
│   └── yourturn.wav
│
├── src/
│   ├── main.ts
│   ├── save.ts
│   │
│   ├── ai/
│   │   ├── EasyAI.ts
│   │   ├── NormalAI.ts
│   │   └── HardAI.ts
│   │
│   ├── game/
│   │   ├── Board.ts
│   │   ├── Chance.ts
│   │   ├── Game.ts
│   │   ├── Player.ts
│   │   ├── Property.ts
│   │   └── Types.ts
│   │
│   ├── ui/
│   │   ├── ActionMenu.ts
│   │   ├── App.ts
│   │   ├── Board32.ts
│   │   ├── BoardView.ts
│   │   ├── DiceView.ts
│   │   ├── GameLog.ts
│   │   ├── Logo.ts
│   │   ├── PlayerView.ts
│   │   ├── PropertyInfo.ts
│   │   └── WinnerView.ts
│   │
│   └── utils/
│       └── SoundManager.ts
│
├── tests/
│   └── game_test_full.test.ts
│
├── .gitignore
├── package.json
└── README.md
```
# แต่ละ layer ทำอะไร
---

##  `src/ai` - ai layer

| ไฟล์ | ทำอะไร |
|---|---|
|EasyAI.ts| ซื้อหรือ takeover ทุกครั้งที่มีเงินพอ ไม่คิดมาก|
|NormalAI.ts|ซื้อเมื่อค่าเช่าดีพอ มีเงินสำรองเหลือ และยังไม่ถือที่ดินเต็มโควตา|
|HardAI.ts|ตัดสินใจซื้อโดยดูความคุ้มค่า (ROI) และเช็กว่าตัวเองเงินน้อยกว่าคู่แข่งที่รวยสุดหรือไม่ ถ้าตามหลังจะกล้าเสี่ยงมากขึ้น|

## `src/game` - game layer

| ไฟล์ | ทำอะไร |
|---|---|
|Board.ts|สร้างกระดาน 32 ช่องจากข้อมูลใน Board32.ts และมีฟังก์ชันหาช่องหรือหาที่ดินจาก id|
|Chance.ts|เก็บการ์ด Chance ทั้งหมดพร้อมความน่าจะเป็นของแต่ละใบ และมีฟังก์ชันสุ่มจั่วการ์ด|
|Game.ts|เป็นสมองของเกม ทอยเต๋า เดิน ทำผลตามช่องที่ลงจอด (จ่ายค่าเช่า ภาษี เข้าคุก จั่ว Chance) ซื้อ ขาย และ takeover ที่ดิน จัดการหนี้และล้มละลาย เปลี่ยนตาผู้เล่น และตัดสินผู้ชนะ พร้อมเก็บค่าคงที่ของกติกา เช่น โบนัส GO และค่าประกัน|
|Player.ts|เก็บข้อมูลผู้เล่นหนึ่งคน คือเงิน ตำแหน่ง สถานะ (active, jailed, bankrupt) รายการที่ดิน และจำนวนครั้งที่ซื้อหรือ takeover|
|Property.ts|คือที่ดินหนึ่งแปลง เก็บชื่อ ราคา ค่าเช่า และเจ้าของ|
|Types.ts|รวมชนิดข้อมูลกลางที่ทุกไฟล์ใช้ เช่น Tile, PlayerStatus, ChanceCard, SaveData|

## `src/ui` - UI layer

| ไฟล์ | ทำอะไร |
|---|---|
|ActionMenu.ts|แสดงแถบบอกปุ่มควบคุม และสลับเป็นโหมดทดสอบได้|
|App.ts|คือตัวกลางของทุกอย่าง (orchestrator) ไม่มี logic เกมอยู่ในนี้เลย มีหน้าที่: 1 สร้าง `blessed.screen` และจัด layout ของ view ทั้งหมด 2 ผูกปุ่มกด (`bindKeys`) แล้วเรียก method ของ `Game` ตรงๆ 3 จัดการ popup ต่างๆ (ซื้อที่ดิน, takeover, จ่ายหนี้, ติดคุก, chance, winner screen) แบบ `Promise`-based เพื่อ "หยุดรอผู้เล่นตอบ"|
|Board32.ts | ข้อมูลกระดาน ระบุว่าแต่ละช่องเป็นช่องอะไร ชื่อเมืองอะไร สีอะไร และราคากับค่าเช่าตามระดับสี|
|BoardView.ts|วาดกระดานเกม 32 ช่อง แสดงเจ้าของที่ดิน ตำแหน่งผู้เล่น และปรับขนาดตามหน้าจอ terminal|
|DiceView.ts| วาดหน้าลูกเต๋าและทำ animation ตอนทอย|
|GameLog.ts|แสดงบันทึกเหตุการณ์ในเกม แยกสีและไอคอนตามประเภทข้อความ และเลื่อนดูย้อนหลังได้|
|Logo.ts | เก็บภาพโลโก้ตรงกลางกระดาน มีสองเวอร์ชันตามจำนวนสีที่ terminal รองรับ |
|PlayerView.ts| แสดงตารางผู้เล่นทุกคน (เงิน จำนวนที่ดิน เงินเข้าออกล่าสุด สถานะ) และกำหนดสีประจำผู้เล่น|
|WinnerView.ts| สร้างหน้าจอประกาศผู้ชนะ มีถ้วยรางวัลและกล่องสถิติ|


## `src/utils - SoundManager.ts`
|SoundManager.ts| เล่นเสียงประกอบเกม โดยเปิด PowerShell ค้างไว้เป็น process เดียวแล้วส่งคำสั่งเล่นไฟล์เสียงเข้าไปเป็นคิว และมีระบบสุ่มเสียงแบบถ่วงน้ำหนัก |


### `src/save.ts`
