# Game Design

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

## บอร์ด 32 ช่อง ( `src/ui/Board32.ts` )

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
- **property** - ถ้าที่ดินไม่มีเจ้าของจะมีหน้าต่างแจ้งราคาให้ตัดสินใจซื้อผ่าน popup ถ้าที่ดินนั้นมีเจ้าของและไม่ใช่ตัวเองจะต้องจ่ายค่าเช่าตามที่ตั้งไว้

## หนี้และล้มละลาย

- **ทุกครั้งที่ผู้เล่นยังมีที่ดินเหลือ** -> จะมีเปิด popup ให้เลือกขายที่ดินทีละแปลง หรือประกาศล้มละลายเลย
- หากยังติดลบอยู่หลังขายหมดแล้วจะถือว่า ล้มละลายโดยอัตโนมัติ : จะคืนที่ดินทั้งหมดคืนเป็นของกลาง, เงิน = 0, สถานะ = `bankrupt`, ตัดออกจากลำดับเทิร์นถัดไป

## Takeover

- ผูเเล่น สามารถกด `T` ตอนยืนอยู่บนที่ดินที่บอทเป็นเจ้าของเพื่อ take over
- เงื่อนไขการ takeover ที่ดินของผู้เล่นต้องไม่เกินตามที่ `MAX_PROPERTIES` ตั้งไว้, ผู้ซื้อต้องมีเงินพอ, ยังไม่เกิน `TAKEOVER_LIMIT` ของตัวเอง
- ราคาที่ต้องจ่าย = คิดมาจาก `getTakeOverPrice()` = ราคาที่ดินเดิม × `TAKEOVER_MULTIPLIER`

## ความยากของบอท ( `src/ai/*.ts` )

| | EasyAI | NormalAI | HardAI |
|---|---|---|---|
| ซื้อที่ดินว่าง | ซื้อทันทีถ้ามีเงินพอไม่สนอย่างอื่น | ซื้อถ้าเงินคงเหลือหลังซื้อมากกว่าหรือเท่ากับ 150 | ซื้อถ้าผลตอบแทนเกิน threshold ที่ปรับไว้ว่ากำลังตามหลังคู่แข่งที่รวยสุดหรือไม่ และเงินคงเหลือหลังซื้อน้อยกว่าหรือเท่ากับ 150 |
| Takeover | ทำทันทีถ้ามีเงินพอ | เงื่อนไขเดียวกับซื้อที่ดินว่าง | ทำเฉพาะตอนตามหลังคู่แข่งรวยสุด และผลตอบแทนผ่าน threshold |
| จ่ายประกันตัว | ไม่จ่ายเลย - ยอมติดคุกเสมอ | จ่ายถ้าเหลือเงินมากกว่าหรือเท่ากับ 300 หลังจ่าย | จ่ายถ้าเหลือเงินมากกว่าหรือเท่ากับ 100 หลังจ่าย **และ** (ตามหลังคู่แข่งรวยสุด หรือมีที่ดินมากกว่าหรือเท่ากับ 3 แปลง) |
| ลำดับขายตอนหนี้ท่วม | ขายราคาถูกสุดก่อน | ขายที่ดินที่ ค่าเช่า ต่ำสุดก่อน | ขายที่ดินที่ผลตอบแทนต่ำสุดก่อน |

## Chance cards ( `src/game/Chance.ts` )

รวม probability ทั้งหมด = 1.0 ( 100% )

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

การ์ดที่ทำให้ตำแหน่งเปลี่ยนไปเจอช่อง property/tax/jail จะ resolve effect ของช่องใหม่ต่อทันทีในตาเดียวกัน

