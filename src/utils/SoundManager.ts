import { spawn, type ChildProcess } from "child_process";
import path from "path";

export const SOUNDS = {
    dice: (value: number) => `./assets/${value}.wav`,
    yourTurn: "./assets/round.wav",    // ถึงตาคุณแล้ว
    buyProperty: "./assets/buy.wav",   // ซื้อที่ดิน

    gameStart: "./assets/start.wav",   // เริ่มเกม
    lost: "./assets/lost.wav",         // ว้า แพ้แล้วววว
    noProperty: "./assets/noprop.wav", // งื้อ อย่าเอาที่ดินชั้นไป
    payMoney: "./assets/money.wav",    // จ่ายมาซะดีๆ
} as const;

let Sound_Process: ChildProcess | null = null;

function startSoundProcess() {
    if (Sound_Process && !Sound_Process.killed) {
        return;
    }

    const script = `
$player = New-Object System.Media.SoundPlayer

while ($true) {
    $line = [Console]::In.ReadLine()

    if ($null -eq $line) {
        break
    }

    if ($line -eq "STOP") {
        try { $player.Stop() } catch {}
        continue
    }

    if ($line.StartsWith("PLAY:")) {
        $file = $line.Substring(5)

        try {
            $player.Stop()
            $player.SoundLocation = $file
            $player.Load()
            $player.Play()
        }
        catch { }
    }
}

try {
    $player.Stop()
} catch {}
`;

    Sound_Process = spawn("powershell.exe", [ "-NoProfile", "-NoLogo", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script,], {windowsHide: true, stdio: ["pipe", "ignore", "ignore"]});
    Sound_Process.on("exit", () => {
        Sound_Process = null;
    });

    Sound_Process.on("error", () => {
        Sound_Process = null;
    });

    Sound_Process.stdin?.setDefaultEncoding("utf8");
}

export function playSound(file: string): void {
    startSoundProcess();

    const soundPath = path.resolve(file);
    if (Sound_Process?.stdin?.writable) {
        Sound_Process.stdin.write(`PLAY:${soundPath}\n`);
    }
}

export function stopSound(): void {
    if (Sound_Process?.stdin?.writable) {
        Sound_Process.stdin.write("STOP\n");
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
}

