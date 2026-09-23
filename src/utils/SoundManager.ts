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

let soundProcess: ChildProcess | null = null;

function startSoundProcess() {
    if (soundProcess && !soundProcess.killed) {
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

    soundProcess = spawn("powershell.exe", [ "-NoProfile", "-NoLogo", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script,], {windowsHide: true, stdio: ["pipe", "ignore", "ignore"]});
    soundProcess.on("exit", () => {
        soundProcess = null;
    });

    soundProcess.on("error", () => {
        soundProcess = null;
    });

    soundProcess.stdin?.setDefaultEncoding("utf8");
}

export function playSound(file: string): void {
    startSoundProcess();

    const soundPath = path.resolve(file);
    if (soundProcess?.stdin?.writable) {
        soundProcess.stdin.write(`PLAY:${soundPath}\n`);
    }
}

export function stopSound(): void {
    if (soundProcess?.stdin?.writable) {
        soundProcess.stdin.write("STOP\n");
    }
}

export function closeSoundManager(): void {
    if (soundProcess) {
        try {
            soundProcess.stdin?.write("STOP\n");
            soundProcess.stdin?.end();
        } catch {}
        soundProcess = null;
    }
}

