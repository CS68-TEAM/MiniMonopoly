# AI Behavior

บอท 3 ตัวอยู่ใน `01-Source-code/ai/`

* `EasyAI.ts`
* `NormalAI.ts`
* `HardAI.ts`

ทั้ง 3 ตัวใช้โครงสร้างหลักเหมือนกัน และรับผิดชอบ **AI Action** มี การเดิน, ซื้อที่ดิน, Take Over, การตัดสินใจติดสินบน เเละการขายที่ดินของตัวมันเอง

## เปรียบเทียบ AI Action

### ซื้อที่ดิน
-Easy ROI `rent x 4 - price x 0.25` ต้องมากกว่า threshold และเงินหลังซื้อ มากกว่าหรือเท่ากับ 150         
-Normal	`rent มากกว่าหรือเท่ากับ 30`, เงินหลังซื้อ มากกว่าหรือเท่ากับ 150 และจำนวน Property ยังไม่ถึง `MAX_PROPERTIES`       
-Hard ซื้อถ้า `money มากกว่าหรือเท่ากับ price`       
### Take Over
-Easy ต้องตามหลังคู่แข่งที่รวยที่สุด + ROI มากกว่า threshold + เงินหลัง Take Over มากกว่าหรือเท่ากับ 150 
-Normal เงินหลัง Take Over มากกว่าหรือเท่ากับ 150 + `rent มากกว่าหรือเท่ากับ 30` + จำนวน Property ยังไม่ถึง `MAX_PROPERTIES` 
-Hard Take Over ถ้า `money มากกว่าหรือเท่ากับ offer` 
### ติดสินบน
-Easy จ่ายถ้าเงินหลังจ่าย มากกว่าหรือเท่ากับ 100 และ (ตามหลังคู่แข่ง หรือมี Property มากกว่าหรือเท่ากับ 3)               
-Normal จ่ายถ้าเงินหลังจ่าย มากกว่าหรือเท่ากับ 300                                                          
-Hard ไม่จ่าย                       
### ลำดับขาย Property ตอน Bankruptcy
-Easy ขายที่ดินที่ `rent / price` ต่ำสุดก่อน                                                      
-Normal ขายที่ดินที่ `rent` ต่ำสุดก่อน                                                               
-Hard ขายที่ดินที่ `price` ต่ำสุดก่อน            

---

## EasyAI


HardAI ใช้เงื่อนไขที่ตรงไปตรงมาที่สุดในการซื้อและ Take Over

### Buy

ถ้า:

```text
money มากกว่าหรือเท่ากับ property.price
```

ก็ซื้อทันที

ไม่มีการตรวจ ROI, Rent หรือเงินสำรองหลังซื้อใน AI เพราะ Hard มันจะเป็นตัวที่กล้าซื้อที่สุด

### Take Over

คำนวณ:

```text
offer = property.price x TAKEOVER_MULTIPLIER
```

ถ้า:

```text
money มากกว่าหรือเท่ากับ offer
```

ก็ Take Over ไปเลย

### Jail Bail

`decideJail()` คืนค่า `false` เสมอ ดังนั้น HardAI จะไม่จ่าย Jail Bail เพราะมันเปลืองตัง

### Sell Priority

เรียง Property จากราคาต่ำไปสูง

ดังนั้น Property ที่ราคาถูกกว่าจะถูกขายก่อน

---

## NormalAI

NormalAI ใช้กฎที่เซ้ตค่าไว้โดยตรง โดยไม่คำนวณ ROI (Return on Investment) หรือเปรียบเทียบเงินกับคู่แข่ง

### ซื้อที่ดิน

ต้องผ่านเงื่อนไขตามนีั้:

* เงินหลังซื้อ มากกว่าหรือเท่ากับ `150`
* `rent มากกว่าหรือเท่ากับ 30`
* จำนวน Property ยังน้อยกว่า `MAX_PROPERTIES`

### Take Over

ใช้เงื่อนไขเดียวกับการซื้อ Property แต่คำนวณเงินจากราคา Take Over:

* เงินหลัง Take Over มากกว่าหรือเท่ากับ `150`
* `rent มากกว่าหรือเท่ากับ 30`
* จำนวน Property ยังน้อยกว่า `MAX_PROPERTIES`

### Jail Baribe

จ่ายสินบน เมื่อเงินหลังจ่ายเหลืออย่างน้อย `300`

### Sell Priority

เรียง Property จาก `rent` ต่ำไปสูง

ดังนั้น Property ที่มี Rent ต่ำกว่าจะถูกขายก่อน

---

## HardAI

HardAI ใช้การประเมิน ROI (Return on Investment) และสถานะทางการเงินของตัวเองในการตัดสินใจ

### ซื้อที่ดิน

คำนวณ ROI:

```text
ROI = rent x 4 - price x 0.25
```

จากนั้นเปรียบเทียบกับ ROI threshold (Threshold = ค่าขีดจำกัด / ค่าเกณฑ์)

* ถ้านำคู่แข่ง อยู่ ROI ต้องมากกว่า `0`
* ถ้าตามคู่แข่ง อยู่ ROI ต้องมากกว่า `-20`

และ หลังซื้อก็จะต้องเหลือเงินอย่างน้อย `150`

### Take Over

Ai มันจะ Take Over เมื่อ:

* AI ตามหลังคู่แข่งที่รวยที่สุด
* ROI ผ่าน threshold
* เงินหลัง Take Over เหลืออย่างน้อย `150`

### Jail Bribe

จะติดสินบนเมื่อ:

* เงินหลังจ่ายเหลืออย่างน้อย `100`
* และเข้าเงื่อนไขอย่างใดอย่างหนึ่ง:

  * ตามหลังคู่แข่งที่รวยที่สุด
  * มี Property อย่างน้อย `3` ที่

### Sell Priority

เรียง Property ตาม:

```text
rent / price
```

จากค่าต่ำไปสูง ดังนั้นตัว Property ที่มีค่า `rent / price` ต่ำกว่าจะถูกขายก่อน

### ความหมายของ "ตามหลัง"

`isBehindRichestOpponent()` จะนำเงินของผู้เล่นที่ยังไม่ Bankrupt มาเทียบ

```text
AI money < เงินของคู่แข่งที่รวยที่สุด
```

ถ้าเป็นจริงถือว่า AI มัน "ตามหลัง"

---

# ถ้าต้องการแก้ AI Action

| ต้องการแก้                    | ไฟล์          | ส่วนที่ต้องดู         |
| ----------------------------- | ------------- | --------------------- |
| เงื่อนไข Buy ของ Easy         | `EasyAI.ts`   | `resolve()`           |
| ROI ของ Easy                  | `EasyAI.ts`   | `roi`, ROI threshold  |
| เงื่อนไข Take Over ของ Easy   | `EasyAI.ts`   | `resolve()`           |
| เงื่อนไข Jail ของ Easy        | `EasyAI.ts`   | `decideJail()`        |
| ลำดับขายของ Easy              | `EasyAI.ts`   | `sellPriority`        |
| เงื่อนไข Buy ของ Normal       | `NormalAI.ts` | `resolve()`           |
| Rent ขั้นต่ำของ Normal        | `NormalAI.ts` | `GOOD_RENT_THRESHOLD` |
| เงื่อนไข Take Over ของ Normal | `NormalAI.ts` | `resolve()`           |
| เงื่อนไข Jail ของ Normal      | `NormalAI.ts` | `decideJail()`        |
| ลำดับขายของ Normal            | `NormalAI.ts` | `sellPriority`        |
| เงื่อนไข Buy ของ Hard         | `HardAI.ts`   | `resolve()`           |
| เงื่อนไข Take Over ของ Hard   | `HardAI.ts`   | `resolve()`           |
| เงื่อนไข Jail ของ Hard        | `HardAI.ts`   | `decideJail()`        |
| ลำดับขายของ Hard              | `HardAI.ts`   | `sellPriority`        |
| ราคา Take Over                | `Game.ts`     | `TAKEOVER_MULTIPLIER` |
| จำนวน Property สูงสุด         | `Game.ts`     | `MAX_PROPERTIES`      |
| จำนวน Take Over สูงสุด        | `Game.ts`     | `TAKEOVER_LIMIT`      |
| การซื้อจริง                   | `Game.ts`     | `buy()`               |
| การ Take Over จริง            | `Game.ts`     | `takeOver()`          |

## Known Limitations

AI เป็นผู้ **ตัดสินใจ** ว่าจะทำ Action หรือไม่ แต่การดำเนิน Action จริงอยู่ใน `Game`

ดังนั้น:

```text
AI
 ↓
ตัดสินใจ Buy / Take Over
 ↓
Game.buy() / Game.takeOver()
 ↓
Game ตรวจสอบกฎของเกมอีกครั้งด้วย
```

ต่อให้ AI ตัดสินใจซื้อได้ `Game` ก็ยังสามารถปฏิเสธ Action ได้ถ้ามันไม่ผ่านข้อจำกัดของเกม เช่น `MAX_PROPERTIES`, `MAX_DIRECT_PURCHASES` หรือ `TAKEOVER_LIMIT`

## ถ้าอยากเพิ่ม AI ระดับใหม่

1. สร้าง `01-Source-code/ai/XxxAI.ts` ใช้โครงสร้างของ AI ตามอันเดิม
2. กำหนด `sellPriority`, `decideJail`, `move()` และ `resolve()` ให้ตัวใหม่
3. เพิ่มค่า `PlayerKind` ใน `01-Source-code/game/Types.ts`
4. ไปลงทะเบียน AI ตอนสร้างผู้เล่นใน `main.ts` / `App.ts`
5. หากจำนวนผู้เล่นเปลี่ยน ต้องตรวจสอบข้อจำกัดจำนวนผู้เล่นของ `Game` ด้วย
