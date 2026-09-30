# Game Design / Spec

## เป้าหมายเกม

ผู้เล่น 4 คนตายตัว ( 1 Human + 3 บอท: Easy, Normal, Hard) วนตาเล่นจนเหลือผู้เล่นที่ไม่ล้มละลายคนเดียว

## ค่าคงที่หลัก ( `src/game/Game.ts` )

| ค่าคงที่ | ค่า default | ความหมาย |
|---|---|---|
| `START_BONUS` | 200 | เงินที่ได้ตอนผ่าน/ลงช่อง START |
| `JAIL_BAIL_AMOUNT` | 250 | ค่าประกันตัวออกจากคุก |
| `TAKEOVER_MULTIPLIER` | 1.5 | ราคาที่ต้องจ่ายเพื่อ takeover = ราคาที่ดิน × ค่านี้ |
| `MAX_PROPERTIES` | 5 | ที่ดินสูงสุดที่ผู้เล่น 1 คนถือได้ |
| `MAX_DIRECT_PURCHASES` | 7 | จำนวนครั้งสูงสุดที่ "ซื้อตรง" (ไม่ใช่ takeover) ได้ทั้งเกม |
| `TAKEOVER_LIMIT` | 1 | จำนวนครั้งสูงสุดที่ takeover ได้ทั้งเกม (ต่อผู้เล่น) |
| `SELL_RATE` | 0.3 | ขายที่ดินคืนได้ 30% ของราคาซื้อ |
| `TAX_RATE` | 0.15 | ช่อง tax เก็บ 15% ของเงินสดที่มีตอนนั้น |

## บอร์ด (32 ช่อง - `src/ui/Board32.ts`)

| Index | ชื่อ | ประเภท | สี |
|---|---|---|---|
| 0 | GO | start | - |
| 1 | Bangkok | property | cyan |
| 2 | Hanoi | property | yellow |
| 3 | Chance | chance | - |
| 4 | Jakarta | property | magenta |
| 5 | Manila | property | green |
| 6 | Tax | tax | - |
| 7 | Oslo | property | blue |
| 8 | JAIL | jail | - |
| 9 | Tokyo | property | red |
| 10 | Seoul | property | blue |
| 11 | Chance | chance | - |
| 12 | Beijing | property | green |
| 13 | Shanghai | property | magenta |
| 14 | HongKong | property | cyan |
| 15 | Taipei | property | yellow |
| 16 | Free Park | parking | - |
| 17 | Sydney | property | cyan |
| 18 | Auckland | property | yellow |
| 19 | Chance | chance | - |
| 20 | Mumbai | property | magenta |
| 21 | Delhi | property | green |
| 22 | Dubai | property | blue |
| 23 | Istanbul | property | red |
| 24 | Go Jail | goToJail | - |
| 25 | London | property | green |
| 26 | Paris | property | magenta |
| 27 | Chance | chance | - |
| 28 | Berlin | property | cyan |
| 29 | Rome | property | yellow |
| 30 | Madrid | property | red |
| 31 | Tax | tax | - |

ราคา/ค่าเช่าผูกกับ**สี** ไม่ใช่ช่องเดี่ยวๆ

| สี | ราคา | ค่าเช่า |
|---|---|---|
| cyan | 500 | 175 |
| green | 1000 | 350 |
| yellow | 1500 | 525 |
| magenta | 2000 | 700 |
| red | 2500 | 875 |
| blue | 3000 | 1050 |

## กติกาแต่ละประเภทช่อง

- **start** - รับ `START_BONUS` จำนวน 200$
- **tax** - จ่าย `TAX_RATE` ของเงินสดปัจจุบัน (คำนวณจากเงิน ณ ตอนนั้น ไม่ใช่ทรัพย์สินรวม)
- **jail / goToJail** - สถานะเปลี่ยนเป็น `jailed` ข้ามเทิร์นถัดไป (`goToJail` เพิ่มการวาร์ป position ไปช่อง 8 ด้วย)
- **parking** - ไม่มีผลอะไรเลย
- **chance** - สุ่มการ์ดแล้ว apply effect ใส่คนที่สุ่ม ถ้าการ์ดสั่งขยับตำแหน่งไปช่องอื่น จะ resolve tile ใหม่นั้นต่อทันที
- **property** - ถ้าที่ดินไม่มีเจ้าของจะมีหน้าต่างแจ้งราคาให้ตัดสินใจซื้อผ่าน popup, บอทตัดสินใจเองใน `resolve()` ของ AI class) ถ้ามีเจ้าของและไม่ใช่ตัวเอง: จ่ายค่าเช่าอัตโนมัติทันที (`payRent()`) ไม่ต้องถามใคร

## หนี้และล้มละลาย

- **ทุกครั้งที่ผู้เล่นยังมีที่ดินเหลือ** -> จะมีเปิด popup ให้เลือกขายที่ดินทีละแปลง หรือประกาศล้มละลายเลย
- หากยังติดลบอยู่หลังขายหมดแล้วจะถือว่า ล้มละลายโดยอัตโนมัติ : จะคืนที่ดินทั้งหมดคืนเป็นของกลาง, เงิน = 0, สถานะ = `bankrupt`, ตัดออกจากลำดับเทิร์นถัดไป

### ทำไม `pendingProperty` กับ `pendingDebt` ใช้ได้กับ human เท่านั้น

`Game.ts` เช็ค `player.id === "human"` ตรงๆ ก่อนตั้งค่า pending state ทั้งสองตัว เพราะระบบนี้ออกแบบมาให้ "หยุดเกมรอ popup ให้คนตอบ" - บอทไม่ต้องรอ popup เพราะตัดสินใจเองอัตโนมัติผ่าน `EasyAI/NormalAI/HardAI.resolve()` ที่เรียก `game.buy()`/`game.takeOver()` ตรงๆ หลัง `game.land()` เสร็จ (ไม่ผ่าน pending flow เลย) ส่วนหนี้ของบอทก็ auto-sell ทันทีใน `coverDebt()` ไม่มี popup ให้รอเหมือนกัน

## Takeover

- Human เริ่มได้เองด้วยปุ่ม `T` ตอนยืนอยู่บนที่ดินที่บอทเป็นเจ้าของ (`startTakeover` → popup ยืนยันราคา → `decideTakeover`)
- บอทเริ่ม takeover เองอัตโนมัติใน `resolve()` ถ้าเข้าเงื่อนไขของแต่ละระดับความยาก (ดูตารางด้านล่าง) - เรียก `game.takeOver()` ตรงๆ ไม่ผ่าน popup
- เงื่อนไขร่วมทุกกรณี (เช็คใน `Game.takeOver()`): ที่ดินของผู้เล่นเป้าหมายต้องไม่เกิน `MAX_PROPERTIES`, ผู้ซื้อต้องมีเงินพอ, ยังไม่เกิน `TAKEOVER_LIMIT` ของตัวเอง
- ราคาที่ต้องจ่าย = `getTakeOverPrice()` = ราคาที่ดินเดิม × `TAKEOVER_MULTIPLIER`

## ความยากของบอท (`src/ai/*.ts`)

| | EasyAI | NormalAI | HardAI |
|---|---|---|---|
| ซื้อที่ดินว่าง | ซื้อถ้า ROI (`rent×4 − price×0.25`) เกิน threshold ที่ปรับตามว่ากำลังตามหลังคู่แข่งรวยสุดหรือไม่ (`-20` ถ้าตามหลัง, `0` ถ้านำ) และเงินคงเหลือหลังซื้อ ≥ 150 | ซื้อถ้า `rent ≥ 30`, เงินคงเหลือหลังซื้อ ≥ 150, ที่ดินยังไม่เกิน `MAX_PROPERTIES` | ซื้อทันทีถ้ามีเงินพอ (`money ≥ price`) ไม่สนอย่างอื่น |
| Takeover | ทำเฉพาะตอนตามหลังคู่แข่งรวยสุด (`isBehindRichestOpponent`) และ ROI ผ่าน threshold | เงื่อนไขเดียวกับซื้อที่ดินว่าง (`rent ≥ 30` + เงินพอ + ยังไม่เกิน MAX_PROPERTIES) | ทำทันทีถ้ามีเงินพอ (`money ≥ offer`) |
| จ่ายประกันตัว | จ่ายถ้าเหลือเงิน ≥ 100 หลังจ่าย **และ** (ตามหลังคู่แข่งรวยสุด หรือมีที่ดิน ≥ 3 แปลง) | จ่ายถ้าเหลือเงิน ≥ 300 หลังจ่าย | ไม่จ่ายเลย (`() => false`) - ยอมติดคุกเสมอ |
| ลำดับขายตอนหนี้ท่วม | ขาย ROI ต่ำสุดก่อน (`rent/price` น้อยสุด) | ขาย rent ต่ำสุดก่อน | ขายราคาถูกสุดก่อน |

## Chance cards (`src/game/Chance.ts`)

รวม probability ทั้งหมด = 1.0

| Probability | ชื่อ | ผล |
|---|---|---|
| 0.10 | Forward +5 | เดินหน้า 5 ช่อง |
| 0.12 | Lucky Day | ได้เงิน $100 |
| 0.13 | Medical Expenses | เสียเงิน $100 |
| 0.05 | Go to Start | วาร์ปกลับ START |
| 0.15 | Speed Ticket | เสียเงิน $50 |
| 0.10 | Property Inspection | เสียเงิน $50 × (จำนวนที่ดินที่ถือ + 1) |
| 0.10 | Market Boom | ได้เงิน $50 × (จำนวนที่ดินที่ถือ + 1) |
| 0.10 | Unexpected Bill | เสียเงิน $150 |
| 0.05 | Lottery | ได้เงิน $500 |
| 0.10 | Backward -3 | ถอยหลัง 3 ช่อง |

การ์ดที่ทำให้ตำแหน่งเปลี่ยนไปเจอช่อง property/tax/jail อื่น จะ resolve effect ของช่องใหม่ต่อทันทีในตาเดียวกัน (ยกเว้นบังเอิญไปเจอช่อง chance อีกอัน - กันไม่ให้วนซ้ำไม่รู้จบ)
