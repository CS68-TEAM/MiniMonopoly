import { spawn, type ChildProcess } from "child_process";
import path from "path";

export const SOUNDS = {
    dice: (value: number) => `./assets/${value}.wav`,
    yourTurn:    "./assets/round.wav",      // ถึงตาคุณแล้ว
    yourTurn2:   "./assets/yourturn.wav",   // ถึงตาคุณแล้ว (ของแถม นานๆได้ยินที)
    buyProperty: "./assets/buy.wav",        // ซื้อที่ดิน

    gameStart:   "./assets/start.wav",      // เริ่มเกม
    lost:        "./assets/lost.wav",       // ว้า แพ้แล้วววว
    win:         "./assets/win.wav",        // เยส ชนะแล้ว
    payMoney:    "./assets/money.wav",      // จ่ายมาซะดีๆ
    gotjail:     "./assets/jail.wav",       // ติดคุก
    Chance:      "./assets/chance.wav",     // เสี่ยงดวง

    takeover:    "./assets/takeover.wav",   // ไม่นะม่าย
    noProperty:  "./assets/noprop.wav",     // งื้อ อย่าเอาที่ดินชั้นไป

    PayRent:     "./assets/sadjung.wav",    // ตอน player ตกที่ดินบอท
    PayRentTwo:  "./assets/payrent.wav",    // ตอน player ตกที่ดินบอท

    move:        "./assets/move.wav",
    diceRoll:    "./assets/diceroll.wav",
    GotMoney:    "./assets/receivedmoney.wav",
    // bankrupt: "./assets/dead.wav",
} as const;

const SOUND_LISTS = {
    take: [
        [SOUNDS.noProperty, 0.50],
        [SOUNDS.takeover, 0.50],
    ],
    turn: [
        [SOUNDS.yourTurn, 0.82],
        [SOUNDS.yourTurn2, 0.18],
    ],
    rent: [
        [SOUNDS.PayRent, 0.30],
        [SOUNDS.PayRentTwo, 0.70],
    ],
} as const;

type SoundKey = keyof typeof SOUND_LISTS;

export function SelectRandom_Sound(key: SoundKey): string {
    const variants = SOUND_LISTS[key];
    const totalWeight = variants.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * totalWeight;

    for (const [sound, weight] of variants) {
        if (roll < weight) 
            return sound;
        roll -= weight;
    }
    return variants[variants.length - 1]![0];
}


let Sound_Process: ChildProcess | null = null;
let stdoutBuffer = "";

const pendingQueue: Array<() => void> = [];
const POWERSHELL_SCRIPT = `
$csharp = @"
using System;
using System.Collections.Concurrent;
using System.Media;
using System.Threading;

public class SoundQueuePlayer
{
    private readonly ConcurrentQueue<string> _queue = new ConcurrentQueue<string>();
    private readonly SoundPlayer _player = new SoundPlayer();
    private readonly AutoResetEvent _signal = new AutoResetEvent(false);
    private readonly Thread _thread;
    private volatile bool _running = true;

    public SoundQueuePlayer()
    {
        _thread = new Thread(Loop);
        _thread.IsBackground = true;
        _thread.Start();
    }

    private void Loop()
    {
        while (_running)
        {
            string file;
            if (_queue.TryDequeue(out file))
            {
                try
                {
                    _player.SoundLocation = file;
                    _player.Load();
                    _player.PlaySync();
                }
                catch { }

                try
                {
                    Console.Out.WriteLine("DONE:" + file);
                    Console.Out.Flush();
                }
                catch { }
            }
            else
            {
                _signal.WaitOne(100);
            }
        }
    }

    public void Enqueue(string file)
    {
        _queue.Enqueue(file);
        _signal.Set();
    }

    public void ClearAndStop()
    {
        string dummy;
        while (_queue.TryDequeue(out dummy)) { }
        try { _player.Stop(); } catch { }
    }

    public void Shutdown()
    {
        _running = false;
        _signal.Set();
    }
}
"@

Add-Type -TypeDefinition $csharp -Language CSharp

$sqp = New-Object SoundQueuePlayer

while ($true) {
    $line = [Console]::In.ReadLine()

    if ($null -eq $line) {
        break
    }

    if ($line -eq "STOP") {
        $sqp.ClearAndStop()
        continue
    }

    if ($line.StartsWith("PLAY:")) {
        $file = $line.Substring(5)
        $sqp.Enqueue($file)
    }
}

$sqp.Shutdown()
`;

function handleStdoutLine(line: string) {
    if (!line.startsWith("DONE:")) return;
    const resolve = pendingQueue.shift();
    resolve?.();
}

function startSoundProcess() {
    if (Sound_Process && !Sound_Process.killed) {
        return;
    }

Sound_Process = spawn(
    "powershell.exe",
    [
        "-NoProfile",
        "-NoLogo",
        "-NonInteractive",
        "-Command",
        POWERSHELL_SCRIPT
    ],
    {
        windowsHide: false,
        stdio: ["pipe", "pipe", "pipe"]
    }
);

Sound_Process.stdin?.setDefaultEncoding("utf8");

Sound_Process.stdout?.setEncoding("utf8");
Sound_Process.stdout?.on("data", (chunk: string) => {
    stdoutBuffer += chunk;
    const lines = stdoutBuffer.split("\n");
    stdoutBuffer = lines.pop() ?? "";

    for (const line of lines) {
        handleStdoutLine(line.trim());
    }
});

Sound_Process.stderr?.setEncoding("utf8");
Sound_Process.stderr?.on("data", (chunk: string) => {
    console.error("[SoundManager PowerShell]", chunk);
});

    Sound_Process.on("exit", () => {
        Sound_Process = null;
        while (pendingQueue.length > 0) {
            pendingQueue.shift()?.();
        }
    });

    Sound_Process.on("error", () => {
        Sound_Process = null;
        while (pendingQueue.length > 0) {
            pendingQueue.shift()?.();
        }
    });
}

export function playSound(file: string): Promise<void> {
    startSoundProcess();

    const soundPath = path.resolve(file);
    return new Promise((resolve) => {
        pendingQueue.push(resolve);

        if (Sound_Process?.stdin?.writable) {
            Sound_Process.stdin.write(`PLAY:${soundPath}\n`);
        } else {
            const idx = pendingQueue.lastIndexOf(resolve);
            if (idx !== -1) pendingQueue.splice(idx, 1);
            resolve();
        }
    });
}

export function stopSound(): void {
    if (Sound_Process?.stdin?.writable) {
        Sound_Process.stdin.write("STOP\n");
    }

    while (pendingQueue.length > 0) {
        pendingQueue.shift()?.();
    }
}

export function closeSoundManager(): void {
    if (Sound_Process) {
        try {
            Sound_Process.stdin?.write("STOP\n");
            Sound_Process.stdin?.end();
        } catch {}
        Sound_Process = null;
    }

    while (pendingQueue.length > 0) {
        pendingQueue.shift()?.();
    }
}

