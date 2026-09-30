# Code Map - อยากแก้อะไร ไปไฟล์ไหน

ตารางนี้เรียงตาม "สิ่งที่อยากทำ" ไม่ใช่เรียงตามไฟล์ เพื่อให้ค้นหาง่ายตอนมีงานต้องแก้

## กติกาเกม

| อยากทำ | ไฟล์ | หมายเหตุ |
|---|---|---|
| เปลี่ยนราคา/ค่าเช่าที่ดิน | `01-Source-code/ui/Board32.ts` | ดูตาราง `COLOR_TIERS` - ราคาจะผูกตามสีของช่อง |
| เปลี่ยนจำนวนเงินเริ่มต้น | `01-Source-code/game/Player.ts` | ค่า default คือ `money = 1000` ใน constructor |
| เพิ่ม/แก้ chance card | `01-Source-code/game/Chance.ts` | เพิ่ม object ใหม่ใน `CHANCE_EVENTS` และ `probability` รวมกันควร ≤ 1 |

## พฤติกรรมบอท

| อยากทำ | ไฟล์ | หมายเหตุ |
|---|---|---|
| ปรับความ "กล้าเสี่ยง" ของบอทระดับไหน | `01-Source-code/ai/EasyAI.ts` / `NormalAI.ts` / `HardAI.ts` | แก้ตัวเลข threshold ที่อยู่บนสุดของแต่ละไฟล์ |


## ระบบเสียง

| อยากทำ | ไฟล์ |
|---|---|
| เพิ่มเสียงใหม่ | `01-Source-code/utils/SoundManager.ts` → เพิ่มชื่อและ path ใน `SOUNDS` + วางไฟล์ `.wav` ใน `assets/` |
| ปรับสุ่มเสียง (เช่น turn/rent/take) | `01-Source-code/utils/SoundManager.ts` สามารถปรับได้ที่ `SOUND_LISTS` |

## Test Mode

| อยากทำ | ไฟล์ |
|---|---|
| เปลี่ยนจำนวนเงินที่ได้ตอนเปิด test mode | `01-Source-code/ui/App.ts` → ค่าคงที่ `TEST_MONEY` |

