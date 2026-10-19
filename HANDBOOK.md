# 用代码生成视频 · AI 技术手册

> **读者是 AI。** 接到"用代码做一个视频"的任务时，先通读本手册，再动手。
> 本手册总结自两个真实项目：知识科普短片《二分猜数字》（纯黑底、纯音乐、卡点）和 App 介绍片《纸面阅读器》（奶白纸面风格，演示同一套转场与手机界面的做法）。
> 两个项目的完整源码都在 `vibe-video/` 下，可以直接复用。手册中的数字、坑和流程都经过实测，不是推测。

---

## 0. 先读这一节：工作守则

1. **先给 10–20 秒试片，用户确认后再做整片。** 试片要包含全片第一个高潮（音乐重拍那一下），否则用户判断不了效果。风格定了以后再一段一段往下做，哪段不满意只重做那一段。
2. **长任务必须定时汇报进度。** 下载、安装、渲染这类超过 30 秒的操作，放到后台跑，每 30–60 秒报一次“百分之几、第几帧 / 共几帧”。不要让用户干等。这是用户明确提过的要求。
3. **往用户电脑装东西前先说明并征得同意。** 优先装在用户目录、不改系统 PATH、不需要管理员权限。
4. **参考资料只是参考。** 网上的教程和提示词经常有错，比如有一份流行的提示词把示例配乐的重拍写成 17.0s，实测是 16.30s，差了 21 帧。所有时间点、数字都要自己实测或算出来，不要照抄。
5. **科普内容里的数字必须真实可算。** 宁可用 1,048,576 这种不整齐的真实数，也不要编造整数。画面演示的过程要和算法实际执行的一致。
6. **画面、音效、字幕共用同一条时间轴。** 所有时刻写在 `timeline.json` 里；TSX 和 Python 读同一个文件，用同一个公式（见 §5）。
7. **交付前自己先检查。** 抽关键帧看图、完整解码一遍、用互相关验证音画同步，都通过了才发给用户（见 §10）。
8. **成片复制到用户工作目录根部**，起中文文件名，再用 SendUserFile 发送。

---

## 1. 技术栈总览

```
            ┌────────────── timeline.json（唯一时间来源，单位：帧 @30fps）──────────────┐
            │                                                                              │
  配乐 mp3 ─┼─► Python 分析（librosa）──► BPM / 重拍 / 换气点 ──► 写回 timeline.json      │
            │                                                                              │
            ├─► Python 合成音效（numpy/scipy）──► public/sfx.wav（整条音效轨，按帧放置）    │
            │                                                                              │
            └─► Remotion（React + TS）每一帧 = f(frame) 的纯函数 ──► Chrome 截帧 ──► mp4  │
                     ├ <Audio bgm>  ├ <Audio sfx.wav>  ├ 字体 / 图片 / 视频素材             │
                     └──────────────────────────────────────────────────────────────────────┘
质检：remotion still 抽帧 → 拼对比图看图；ffmpeg 解码；互相关测音画偏移
```

| 层 | 工具 | 用途 |
|---|---|---|
| 画面 | **Remotion 4.x**（React 19 + TypeScript） | 每一帧都是代码画出来的；Chrome 无头截帧后编码 |
| 音效 | **Python + numpy + scipy + soundfile** | 用数学合成所有音效，无版权问题，可精确对齐到采样 |
| 音乐分析 | **librosa** | BPM、节拍、起音强度、逐帧响度 |
| 素材处理 | **ffmpeg**（系统版） | 抽帧、裁切、提取音频、检测切镜。Remotion 渲染不依赖它，Remotion 自带编码器 |
| 质检拼图 | **Pillow** | 对比图、接触表 |
| 其他 | qrcode | 生成矢量二维码（SVG，放大不糊） |

---

## 2. 环境搭建

### 2.1 本机已验证的环境（Windows，无管理员权限）

| 组件 | 版本 | 安装位置 / 方式 |
|---|---|---|
| Node.js | v24.22.0 LTS | `%LOCALAPPDATA%\vibe-video-tools\node\node-v24.22.0-win-x64\`（官方 zip 解压） |
| npm | 11.19.1 | 随 Node |
| ffmpeg | N-92722（2018 年构建，够用） | `%LOCALAPPDATA%\vibe-video-tools\ffmpeg-pkg\node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe` |
| Chrome | 系统已装 | `C:/Program Files/Google/Chrome/Application/chrome.exe`，渲染时用 `--browser-executable` 指定 |
| Python | 3.12.10 | 系统已装 |
| Python 库 | librosa 1.0.0、scipy 1.18.1、soundfile 0.14.0、numpy、Pillow、qrcode | `python -m pip install ...` |
| Remotion | 4.0.536 | 项目内 `npm install` |

**每条命令开头都要临时加 PATH**（系统 PATH 没改）：

```powershell
$root = "$env:LOCALAPPDATA\vibe-video-tools"; $env:PATH = "$root\node\node-v24.22.0-win-x64;$env:PATH"
$ff = "$root\ffmpeg-pkg\node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe"
```

### 2.2 全新机器从零安装（按顺序）

1. **测网络**，决定走哪条源：
   ```powershell
   curl.exe -s -o NUL -w "npm: %{http_code}`n" --max-time 20 https://registry.npmjs.org/
   curl.exe -s -o NUL -w "github: %{http_code}`n" --max-time 20 https://github.com/
   curl.exe -s -o NUL -w "nodejs: %{http_code}`n" --max-time 20 https://nodejs.org/dist/index.json
   ```
2. **Node**：从 `https://nodejs.org/dist/index.json` 取最新 LTS 版本号，下载 `node-vX-win-x64.zip` 解压到用户目录。
3. **ffmpeg**：**优先走 npm**：`npm install @ffmpeg-installer/win32-x64`。npm 源通常很快，实测 4 秒。gyan.dev 实测被限速到 11 KB/s，GitHub 可能完全不通，这两个源不可靠。macOS 用 `@ffmpeg-installer/darwin-arm64` 或 `brew install ffmpeg`。
4. **Remotion 项目**：写 `package.json`（见 §3），然后 `npm install --no-audit --no-fund`。
   - ⚠️ **npm 11 会拦截 esbuild 的 postinstall**（提示 `install-scripts not yet covered by allowScripts`），需要手动执行：`node node_modules\esbuild\install.js`，然后确认 `node_modules\@esbuild\win32-x64\esbuild.exe` 存在。
5. **浏览器**：系统有 Chrome 或 Edge 就直接用 `--browser-executable`，不用让 Remotion 再下载一份。
6. **Python 库**：`python -m pip install librosa soundfile scipy pillow qrcode`。librosa 体积大，放到后台装。
7. **冒烟测试**：渲染一个 60 帧的测试合成，确认整条链路可用。

### 2.3 Remotion 许可

个人和 3 人以内的团队免费；公司超过 3 人需要购买商业许可。做号自用不受影响，替企业做视频时要提醒对方。

### 2.4 Windows PowerShell 5.1 的坑（都踩过）

| 坑 | 解决 |
|---|---|
| 没有 `&&` 和 `\|\|` | 用 `;` 或 `if ($?) { }` |
| 没有 `Join-String` | 用 `(...) -join ', '` |
| Python 打印中文变乱码 | 先设 `$env:PYTHONIOENCODING='utf-8'` |
| `pip install ... \| Select-Object` 后紧跟 `python -c "..."` 会报 inputFormat 错误 | pip 输出丢给 `\| Out-Null`；把 Python 代码写成 .py 文件再执行，不要在 PowerShell 里内联长段代码 |
| `Set-Content` 默认 ANSI 编码 | 加 `-Encoding utf8` |
| 原生程序的 stderr 用 `2>&1` 重定向会被标成错误 | 渲染日志用 `2>&1 \| Out-File log -Encoding utf8`，然后解析日志文本 |
| ffmpeg `drawtext` 报 Fontconfig 警告 | 必须显式写 `fontfile=C:/Windows/Fonts/consola.ttf`，警告本身可以忽略 |
| libx264 报 `height not divisible by 2` | 缩放后的宽高必须是偶数 |
| 运行 Python 处理下载来的文件 | 用 `python -I`（隔离模式），脚本不要放在素材目录里 |

### 2.5 本机可用字体（Windows）

- 中文：微软雅黑 `msyh.ttc` / `msyhbd.ttc` / `msyhl.ttc`（Light）、宋体 `simsun.ttc`、楷体 `simkai.ttf`、隶书 `SIMLI.TTF`、华文宋体 `STSONG.TTF`、等线 `Deng.ttf` / `Dengl.ttf`
- 数字 / 西文：**Bahnschrift**（数字很好看，适合大号数字）、Segoe UI Light、Consolas（等宽）
- **跨机器稳定的做法**：把字体文件放进 `public/`，用 `FontFace` 加载（见 §4.6）。思源宋体 / 思源黑体是 SIL OFL 许可，可以随项目分发。

---

## 3. 项目结构模板

```
vibe-video/
├─ package.json            # remotion / @remotion/cli 4.0.536, react 19.1.0, typescript 5.9.3
├─ tsconfig.json           # jsx: react-jsx, moduleResolution: bundler, resolveJsonModule: true
├─ public/                 # staticFile() 能访问的素材
│  ├─ bgm.mp3              # 配乐
│  ├─ sfx.wav              # Python 合成的整条音效轨
│  └─ <项目名>/             # 字体、图片、视频片段、二维码 svg
├─ src/
│  ├─ index.ts             # registerRoot(RemotionRoot)
│  ├─ Root.tsx             # 注册所有 <Composition>
│  ├─ timeline.json        # ★ 时间轴：所有帧号、字幕、音效 cue
│  └─ <项目名>/             # 每个视频一个目录：shared.tsx + 各幕组件
├─ tools/                  # Python 工具（分析、合成、质检）
└─ out/                    # 渲染输出、抽帧、对比图
```

`package.json`：

```json
{
  "name": "vibe-video", "private": true,
  "scripts": { "start": "remotion studio", "render": "remotion render" },
  "dependencies": { "@remotion/cli": "4.0.536", "remotion": "4.0.536", "react": "19.1.0", "react-dom": "19.1.0" },
  "devDependencies": { "@types/react": "19.1.8", "@types/react-dom": "19.1.6", "typescript": "5.9.3" }
}
```

`tsconfig.json`：

```json
{ "compilerOptions": { "target": "ES2018", "module": "ESNext", "jsx": "react-jsx", "strict": true,
  "esModuleInterop": true, "skipLibCheck": true, "moduleResolution": "bundler",
  "resolveJsonModule": true, "noEmit": true, "lib": ["ES2018", "DOM"] }, "include": ["src"] }
```

---

## 4. Remotion 写法规范

### 4.1 铁律：每一帧都是 `frame` 的纯函数

- 所有动画都通过 `useCurrentFrame()` 和 `interpolate()` / `spring()` 算出来。
- **禁止** CSS `transition` / `animation` / `@keyframes`，禁止 `setTimeout`。渲染是多进程乱序截帧，这些在成片里会错乱。
- **禁止**不带种子的 `Math.random()`。需要随机就写一个用种子的伪随机函数，或者预先生成到 JSON 里。
- 组件里根据帧号直接 `return null` 来控制出场和退场，不要用状态。

### 4.2 Composition 注册

```tsx
<Composition id="BinaryGuess" component={BinaryGuess}
  durationInFrames={T.end} fps={30} width={1920} height={1080} />
```

画布固定按 1920×1080 设计，所有坐标写成绝对像素。要出 2K / 4K 时用渲染参数 `--scale` 放大（§10.4），不要改设计坐标。

### 4.3 动画工具函数（直接复制）

```tsx
import { Easing, interpolate } from 'remotion';
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

// 0→1 进度，最常用
export const ramp = (f: number, a: number, b: number, e = easeOut) =>
  interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });

// 分段关键帧：keys(f, [[帧, 值], [帧, 值], ...])
export const keys = (f: number, ks: [number, number][], e = easeInOut) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++)
    if (f <= ks[i][0]) return interpolate(f, [ks[i - 1][0], ks[i][0]], [ks[i - 1][1], ks[i][1]], { ...clamp, easing: e });
  return ks[ks.length - 1][1];
};

// 随拍子“呼吸”：每拍开头最亮然后衰减（beatFrames=15.33，beatAnchor=某个实测重拍帧）
export const beatPulse = (f: number, anchor: number, beat: number) => {
  const ph = (((f - anchor) % beat) + beat) % beat;
  return Math.exp(-ph / 5);
};
```

**`interpolate` 一定要带 `clamp`**，否则区间外的值会继续外推，元素会飞出画面或透明度变成负数。

### 4.4 音频

```tsx
<Audio src={staticFile('bgm.mp3')} volume={(fr) => interpolate(fr, [1790, 1825], [0.85, 0], clamp)} />
<Audio src={staticFile('sfx.wav')} volume={1} />
```

- 配乐和音效轨分成两条 `<Audio>`，方便单独调音量。
- 结尾淡出写在 `volume` 回调里，回调的参数是帧号。
- 配乐要从第 0 帧开始播放，它的时间点才能和分析结果对上。

### 4.5 视频素材（复刻时复用原片片段）

```tsx
<Sequence from={168} durationInFrames={470} layout="none">
  <OffthreadVideo src={staticFile('wenku/discover.mp4')} muted style={{ width: 390, height: H, objectFit: 'cover' }} />
</Sequence>
```

- 用 `OffthreadVideo`，不要用 `<Video>`，它逐帧精确。
- 视频要从合成里的某一帧开始播放，就包一层 `<Sequence from=...>`。
- 素材边缘用 `mask-image` 线性渐变羽化，融进背景（见 WenkuPromo.tsx 的 `OpeningFootage`）。

### 4.6 自带字体加载（保证渲染时已加载完）

```tsx
import { continueRender, delayRender, staticFile } from 'remotion';
const h = delayRender('font');
Promise.all([['SourceHanSerifCN-Regular.otf', '400'], ['SourceHanSerifCN-Bold.otf', '700']].map(([file, w]) =>
  new FontFace('MySerif', `url(${staticFile(`fonts/${file}`)})`, { weight: w }).load()
    .then((f) => (document.fonts as unknown as { add: (x: FontFace) => void }).add(f)),
)).then(() => continueRender(h));
```

TS 的 DOM 类型里 `document.fonts.add` 会报错，要像上面这样做一次类型断言。

### 4.7 逻辑尺寸缩放（画手机界面等小元素）

先按真实设备的逻辑宽度设计（比如手机宽 390），外层再 `transform: scale(实际宽/390)`。界面里的字号、间距就可以照抄 App 的真实数值。见 `src/wenku/Phone.tsx`。

---

## 5. 时间轴：画面与声音同源

### 5.1 `timeline.json` 结构（二分视频的实例）

```json
{
  "fps": 30, "end": 1826, "beatFrames": 15.33, "beatAnchor": 489,
  "drop": 489,
  "march": { "start": 186, "end": 277, "from": 1, "to": 40, "power": 2 },
  "subs": [ { "from": 65, "to": 122, "text": "我心里想了一个数，在 1 到 100 之间" } ],
  "sfx":  [ { "frame": 489, "type": "impact", "gain": 0.95 },
            { "frame": 642, "type": "marimba", "note": "F#4", "gain": 0.36, "pan": 0 } ]
}
```

- TSX 里 `import T from '../timeline.json'`，Python 里 `json.load`。
- **全部用帧号**，不用秒。秒换帧：`round(t * 30)`。
- JSON 的键名不能和别的段重名。踩过的坑：顶层 `outro: 551` 和后来加的 `outro: {...}` 冲突，TS 直接报类型错误。

### 5.2 同一个公式写两遍

画面上每变化一次就要响一声的场景（比如逐格计数、数字滚动），TSX 和 Python 用**完全相同**的公式算出每一帧的值，值变化的那一帧就放一个音效：

```tsx
// TSX
const marchN = (f) => Math.floor(m.from + (m.to - m.from) * Math.pow((f - m.start) / (m.end - m.start), m.power));
```
```python
# Python：同一个公式，记录值变化的帧
for f in range(m["start"], m["end"]):
    n = math.floor(m["from"] + (m["to"] - m["from"]) * ((f - m["start"]) / (m["end"] - m["start"])) ** m["power"])
    if n != last: frames.append((f, n)); last = n
```

两边各写一份注释，互相指向对方，以后改公式时两边一起改。

---

## 6. 音乐分析

### 6.1 原则

- librosa 的 `beat_track` 只给大致的拍子，**关键点必须逐帧看响度表**。
- 关键点有三类：**重拍**（起音强度峰值）、**换气**（重拍前的一小段近静音）、**段落分界**（结构变化）。
- 画面的爆点要对准**起音帧**（能量开始猛升的那一帧），不是响度最大的那一帧。

### 6.2 逐帧响度表（最常用的工具）

`tools/precise_15_19.py`：把一段时间里每一帧的 RMS dB 和起音强度打印出来，人工判断。

```python
import sys, librosa, numpy as np
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
hop = sr // 30                                   # 一个 hop = 一帧 @30fps
db = librosa.amplitude_to_db(librosa.feature.rms(y=y, frame_length=hop*2, hop_length=hop)[0], ref=np.max)
on = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)[:len(db)]
lo, hi = int(float(sys.argv[2])*30), int(float(sys.argv[3])*30)
for f in range(lo, min(hi, len(db))): print("%6.2f %5d %7.1f %6.2f" % (f/30, f, db[f], on[f]))
```

读表方法：找“dB 连续下降到谷底 → 下一帧 dB 猛升 + onset 突然很大”的位置。谷底是换气，猛升那一帧是重拍。

其他工具：
- `tools/analyze_beats.py`：BPM + 全部节拍，按中位数区分强拍和弱拍，输出 JSON。
- `tools/find_drop.py`：自动找“换气 + 重拍”候选点并打分，还能输出结构分段和每 10 秒的响度轮廓。
- 全曲最强起音 Top N：`np.argsort(onset)[-15:]`。

### 6.3 示例配乐实测数据（知识类视频最常用）

> 用户说明：这类视频基本都用同一首音乐，只是文件名不同。拿到音频后先跑一遍 §6.2 核对。如果数据一致，就可以直接用下表。

| 项目 | 实测值 |
|---|---|
| 时长 | 164.23 s（2:44） |
| BPM | 117.45；一拍 = 0.511 s = **15.33 帧** |
| 调性 | **F# 小调**（Krumhansl 相关 0.706） |
| 前奏收束重音 | **9.23 s（f277）**，全曲第二强起音 |
| 第一换气 | 16.20–16.27 s（f486–488），谷底 −21.7 dB |
| **第一重拍（主爆点）** | **16.30 s（f489）**，onset 12.44；峰值 16.37–16.40 s，−1.0 dB |
| 17.07 s | 只是第二记较轻的重音，**不是**主重拍（流行提示词写的 17.0s 是错的） |
| 强起音 | 30.50 s（f915）、46.70 s（f1401，适合做第二爆点）、62.90、64.17、65.93、74.03 s（全曲最强） |
| 段落分界 | 9.26、52.59、56.82、**60.74**（60 秒版本在这里收尾最自然）、62.88、80.81、160.12 s |
| 60.87 s | 下一段的起拍，所以配乐淡出要在 60.6 s 前完成 |

### 6.4 时长建议

抖音知识类视频做 **45–90 秒**。用整首 2:44 太长。60 秒版本卡在 60.74 s 的段落分界上收尾。

---

## 7. 音效合成（核心技能）

### 7.1 思路

- 所有音效都用 numpy 从正弦波和噪声合成：**没有版权问题、音高能和配乐调性一致、能精确对齐到采样**。
- 所有音效混成**一条** `sfx.wav`（44.1 kHz，16 bit，立体声），长度 = 视频时长 + 3.5 秒的混响尾巴。
- 每个 cue 由 `frame, type, gain, pan, note` 描述，从 `timeline.json` 读取。
- **冲击类音效的瞬态放在目标帧的第一个采样上。** 画面动作要提前 3–4 帧起手，最大冲击正好落在这一帧。
- 音高从配乐调性里选（示例配乐是 F# 小调：F# G# A B C# D E）。一串上行的木琴音就是在小调音阶上爬。
- 最后整体做峰值归一化到 0.89，防止削波。

### 7.2 可移植的音效库（完整代码，复制即可用）

完整版见 `vibe-video/tools/sfx.py`，下面是核心部分：

```python
import json, math, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve
SR = 44100; RNG = np.random.default_rng(7)
NOTE = {"C":0,"C#":1,"D":2,"D#":3,"E":4,"F":5,"F#":6,"G":7,"G#":8,"A":9,"A#":10,"B":11}
def hz(n): return 440 * 2 ** ((12 * (int(n[-1]) + 1) + NOTE[n[:-1]] - 69) / 12)
def t_(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)
def lp(x, f): return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)
def edge(x, a=0.002, b=0.01):
    na, nb = int(a*SR), int(b*SR); x[:na] *= np.linspace(0,1,na); x[-nb:] *= np.linspace(1,0,nb); return x

def marimba(f, d=1.6):   # 木琴 / 卡林巴：基音 + 3.9 倍 + 9.2 倍泛音，高泛音衰减快
    t = t_(d); x = (np.sin(2*np.pi*f*t)*np.exp(-t*3.2) + .35*np.sin(2*np.pi*f*3.9*t)*np.exp(-t*14)
                    + .12*np.sin(2*np.pi*f*9.2*t)*np.exp(-t*32))
    return edge(x + .25*RNG.standard_normal(len(t))*np.exp(-t*400))
def bell(f, d=3.0):      # 钟 / 铃：非谐泛音，长尾
    t = t_(d); return edge(sum(a*np.sin(2*np.pi*f*r*t)*np.exp(-t*k) for r,a,k in
                               [(1,1,1.4),(2.76,.45,2.6),(5.4,.25,4.5),(8.93,.12,7)]), .004)
def tick(f, d=0.05):     # 咔哒：计数、滚动
    t = t_(d); return edge(np.sin(2*np.pi*f*t)*np.exp(-t*90) + .3*RNG.standard_normal(len(t))*np.exp(-t*600), .0005, .005)
def sweep(n, f0, f1, blocks=28):   # 分块带通扫频噪声
    z = RNG.standard_normal(n); o = np.zeros(n); e = np.linspace(0, n, blocks+1, dtype=int)
    for i in range(blocks):
        c = f0 * (f1/f0) ** (i/blocks); s = z[max(0, e[i]-2000):e[i+1]]
        o[e[i]:e[i+1]] = bp(s, c*.7, min(c*1.4, SR/2-100))[-(e[i+1]-e[i]):]
    return o
def line_draw():         # 一道光被拉开：上扫气声 + 低音五度垫底
    t = t_(1.4); air = sweep(len(t), 500, 5000) * np.minimum(t/.08, 1) * np.exp(-t*2.8) * .7
    pad = (np.sin(2*np.pi*hz("F#3")*t) + .6*np.sin(2*np.pi*hz("C#4")*t)) * np.minimum(t/.05,1)*np.exp(-t*1.6)*.45
    return edge(air + pad)
def whoosh():            # 一半被排除、滑走：下行气声
    t = t_(.45); return edge(sweep(len(t), 4200, 600, 18) * np.minimum(t/.04, 1) * np.exp(-t*7.5) * 1.2)
def thud():              # 闷击 / 卡住
    t = t_(.6); ph = 2*np.pi*np.cumsum(130*np.exp(-t*9)+52)/SR
    return edge(np.tanh((np.sin(ph)*np.exp(-t*7) + .5*lp(RNG.standard_normal(len(t)), 2500)*np.exp(-t*160))*1.6), .0005)
def riser(d):            # 蓄力：指数上扫 + 高通噪声渐强，末尾 4ms 切断（制造“换气”）
    t = t_(d); ph = 2*np.pi*np.cumsum(180*(1600/180)**((t/d)**1.4))/SR
    x = (np.sin(ph)*(.75+.25*np.sin(2*np.pi*(3+9*t/d)*t))*.7 + hp(RNG.standard_normal(len(t)), 3000)*.6) * (t/d)**2.2
    return edge(x, .01, .004)
def impact():            # 主爆点：次低频下滑 + 噪声瞬态 + 主音长尾；瞬态在第 0 个采样
    t = t_(3.2); ph = 2*np.pi*np.cumsum(78*np.exp(-t*5)+36)/SR
    body = np.sin(ph)*np.exp(-t*1.25) + .5*np.sin(2*np.pi*hz("F#1")*t)*np.exp(-t*.9)
    return edge(np.tanh(body*2.2)*.9 + lp(RNG.standard_normal(len(t)),5000)*np.exp(-t*45)*.9
                + hp(RNG.standard_normal(len(t)),6000)*np.exp(-t*3.5)*.12, .0003, .2)
def shimmer(notes=("F#5","A5","C#6")):   # 术语浮现：小三和弦铃音，错开 45ms
    x = np.zeros(int(3.4*SR))
    for i, n in enumerate(notes): b = bell(hz(n)); p = int(i*.045*SR); x[p:p+len(b)] += b*(.8-.15*i)
    return x
def suck(d):             # 收拢成一个点：反向气声 + 上扫音
    t = t_(d); return edge(bp(RNG.standard_normal(len(t)), 800, 6000)*(t/d)**2.5
                           + np.sin(2*np.pi*np.cumsum(300*(8)**(t/d))/SR)*(t/d)**3*.35, .01, .006)

def ir(seed):            # 简易混响：衰减噪声脉冲响应
    r = np.random.default_rng(seed); t = t_(2.2); x = lp(r.standard_normal(len(t))*np.exp(-t*3), 7000); x[0] = 0
    return x / np.sqrt(np.sum(x**2))
IRL, IRR = ir(11), ir(23)
def place(buf, sig, frame, gain, pan=0., wet=.25, fps=30):   # 等功率声像 + 混响
    s = int(round(frame/fps*SR)); L, R = gain*math.cos((pan+1)*math.pi/4), gain*math.sin((pan+1)*math.pi/4)
    e = min(len(buf), s+len(sig)); seg = sig[:e-s]
    buf[s:e,0] += seg*L*(1-wet); buf[s:e,1] += seg*R*(1-wet)
    if wet:
        wl = fftconvolve(seg, IRL)[:len(buf)-s]; wr = fftconvolve(seg, IRR)[:len(buf)-s]
        buf[s:s+len(wl),0] += wl*L*wet; buf[s:s+len(wr),1] += wr*R*wet
# 收尾：peak = abs(buf).max(); if peak > .89: buf *= .89/peak; sf.write("public/sfx.wav", buf.astype(np.float32), SR, subtype="PCM_16")
```

### 7.3 音效配方表（什么画面配什么声音）

| 画面动作 | 音效 | 常用 gain | wet | 说明 |
|---|---|---|---|---|
| 光点出现 / 开场 | `bell("F#6")` | 0.10 | 0.45 | 很轻，像画面“醒过来” |
| 线被拉开、元素展开 | `line_draw` | 0.40–0.55 | 0.3 | |
| 标签、数字落定 | `marimba(主音或五度)` | 0.30–0.36 | 0.35 | 左右轻微声像（±0.35） |
| 逐个计数、滚动 | `tick`，音高随数值升高 | 0.12–0.13 | 0.15 | 声像跟着画面元素横向移动 |
| 一半被排除、滑走 | `whoosh` | 0.18–0.24 | 0.25 | 声像放在被排除的那一侧 |
| 卡住 / 失败 / 最坏情况 | `thud` + 一串急促 tick | 0.6 / 0.22 | 0.15 | |
| 蓄力 | `riser(时长)`，在换气点戛然而止 | 0.26–0.30 | 0.1 | |
| **主爆点** | `impact` | 0.95 | 0.3 | 全片最多两次，第二次 gain 约 0.72 |
| 术语、结论浮现 | `shimmer` | 0.12–0.20 | 0.5 | |
| 收成一个点 / 转场 | `suck(时长)` | 0.18–0.30 | 0.15 | |
| 猜中、成功 | `marimba` 高音 + `shimmer` + 轻 `thud` | | | 三层叠加 |
| 一串递进（每拍一次） | `marimba` 沿音阶上行或下行 | 0.24–0.30 | 0.35 | 每个音踩一拍 |

**混音经验**：配乐 0.85，音效轨 1.0。音效的总峰值约 0.85。安静段落的音效 gain 减半。

---

## 8. 视觉动效模式库

全部有现成代码，路径写在括号里。

### 8.1 字幕（`src/binary/shared.tsx` → `Subtitle`）

入场 9 帧：透明度 0→1、上移 14px、模糊 6px→0。出场 8 帧淡出。底部居中，y≈828，46px，字距 6。黑底时加一层 `textShadow` 轻微发光。

### 8.2 爆点（`BinaryGuess.tsx` → `Drop`）

1. 换气前 15 帧：整个画面淡到全黑（`dim` 1→0，easeIn）。
2. 静止约 3 帧。
3. 重拍帧：大字缩放 1.16→1（7 帧，easeOut）+ 去模糊 10px→0（5 帧）+ 径向闪光 0.42→0（14 帧）+ 两圈光环向外扩散（相差 5 帧）。
4. 9 帧后浮出术语小字（中英）。
5. 停住的时候只做极轻的呼吸感（缩放 ±0.8%）。

### 8.3 转场（不硬切）

- **收成一个点再展开**：主体缩到 0.012 倍 → 变成一个光点 → 光点拉成下一幕的线。配 `suck` + `line_draw`。
- **同一个元素贯穿前后两幕**：数轴贯穿全片，镜头推近、拉远、对半切开再展开。
- **对数推镜头**（`Game.tsx` → `lerpView`）：可视宽度按对数插值，速度感均匀，被保留的那一端不动。
- **左滑出 + 裁切**（`wenku/layout.tsx` → `TitleBlock`）：文字块整体左移 760px，被外层 `overflow:hidden` 裁掉。
- **页面推入 / 返回**（`WenkuPromo.tsx` → `Push`）：新页从右侧推入，旧页左移 100px 并变暗。
- 淡入淡出、闪白、黑场只作辅助手段。

### 8.4 其他

- **随拍子呼吸的光**：`beatPulse()` 乘到亮度或光晕上，蓄力段越来越亮。
- **被排除的部分变暗**：先暗到 15%，再推镜头；最后拉远时全部恢复，前后呼应。
- **数字滚动**：滚动期间每变一个数就响一个 tick，落定时缩放跳一下（1.05）。
- **漏斗图**：每一行是一次之后剩下的范围，行与行之间用细线连接端点，目标列用金色贯穿。
- **点按反馈**（`screens.tsx` → `Tap`）：14 帧扩散的涟漪；双击就是两圈相差 7 帧。
- **手机悬浮框**（`Phone.tsx`）：机身厚度 + 斜向软阴影（skewX −52°，blur）+ 玻璃高光。
- **毛玻璃面板**：`backdropFilter: blur(16px)` + 半透明底 + 内描边。

### 8.5 配色规范（两套实测可用）

- **纯黑科普风**：背景 `#000`，主色 `#F2F2F2`，副字 `#A8A8A8`，**只留一个强调色**（金 `#F5C26B`），留给全片最重要的那一刻（例如猜中的那个数）。
- **奶白纸面风**：背景是径向渐变（中心 `#fafaf5` → 边缘 `#ececE5`）+ 5% 的 feTurbulence 噪点；墨色 `#1d1c19`，副字 `#8a8880`，细线 `rgba(30,28,20,0.13)`，强调色 `#a2825f`；标题用思源宋体 Bold。

---

## 9. 内容方法论（知识科普类）

### 9.1 60 秒骨架（对齐示例配乐）

```
0.0 – 9.2s    钩子：第一句用第二人称写观众正在经历的悖论或困惑（“你已经……，为什么还……？”）
              3–4 个画面，每个约 3 秒；同一个现象在 个人 / 自然界 / 群体 三个尺度各出现一次
9.23s  f277   前奏收束重音：片名或核心问题落定
9.2 – 16.2s   蓄力：一句经典引语、一个关键数字，或一个直击要害的问题
16.20s f486   换气：全画面收暗，元素淡出
16.30s f489   主爆点：答案或锚词砸下来
16.6s  f498   术语名（中英）浮现
16.8 – 45s    原理展开（历史、人物、实验都放在高潮之后）
46.70s f1401  第二个小爆点（全片最多两次）
45 – 58s      落到人身上：锚词被重新定义，开头是困境，结尾变成理解或力量
58 – 60.7s    提问收尾：问一个“每个人都答得上来、而且答案不同”的问题
```

### 9.2 要点

- **锚词**：2–4 个字，是这个原理落在普通人生活里的处境，不是术语本身（沉没成本 = “舍不得”，幸存者偏差 = “看不见的人”）。
- **先给答案，再讲原理**：爆点先把结论砸出来，后面再演示为什么。
- **先演示笨办法**：先给出一个强烈的对比（例如最坏要猜 100 次 vs 最多 7 次）。
- **第一秒必须有视觉锚点**：画面里有一个让眼睛落脚的点，比如黑底上的一个光点、一片山里一个穿红衣的人。
- **字幕切换卡在小节线上**；重拍前两三秒让字幕故意只说一半。
- **结尾提问能大幅增加评论**：参考案例中，有问题的视频 409 条评论，没问题的只有 8 条和 12 条。
- **2026 年的算法**：收藏、分享、平均观看时长的权重高于完播率。结尾留一个能带走的东西（一句判断法则或一个清单）。
- **发布**：带上当时在用的活动话题（发布前搜一下当前活动话题，确认名称），@抖音科技。原样搬运别人的作品会被判非原创；复刻时学手法，内容换成自己的。

---

## 10. 渲染与质检

### 10.1 关键帧预览（每次改完都做）

```powershell
npx remotion still <CompId> "out/stills/f490.png" --frame=490 --browser-executable="<chrome>" --log=error
```

一次抽 8–16 帧，放到后台跑，把进度写进 `progress.log`，一边出图一边看。**重点看**：爆点帧、每一幕的开头和结尾、转场中间帧。

### 10.2 正式渲染

```powershell
npx remotion render <CompId> out/xxx.mp4 --browser-executable="<chrome>" --crf=16 --log=info 2>&1 | Out-File out\render.log -Encoding utf8
```

- 放到后台运行，每 30–60 秒解析一次日志里最后一条 `Rendered (\d+)/(\d+)`，换算成百分比报给用户。之后还有 `Encoded n/n`，最后一行是 `+ out/xxx.mp4 xx MB`。
- 本机速度：1080p 约 **11–12 帧/秒**（61 秒的视频约 2.5 分钟，75 秒的约 3 分钟，含视频素材和毛玻璃效果）。

### 10.3 画质参数（重要）

| 参数 | 默认 | 建议 | 说明 |
|---|---|---|---|
| `--crf` | 18 | 14–16 | 越小越清晰、文件越大 |
| `--image-format` | jpeg | **png**（细字、细线多时） | Remotion 默认先把每帧截成 JPEG 再编码，细字和 1px 细线边缘会有压缩痕迹 |
| `--jpeg-quality` | 80 | 95–100 | 不换 png 时至少把它调高 |
| `--scale` | 1 | 1.3333（2K）/ 2（4K） | 见下 |
| `--x264-preset` | medium | slow | 体积相同时质量更好，编码更慢 |

> 上面几个参数是 Remotion 4 的 CLI 选项，用之前先用 `npx remotion render --help` 确认当前版本的写法，并在一个短片段上实测效果。

### 10.4 出 2K / 4K

- **设计坐标不变**，渲染时加 `--scale=1.3333` → 2560×1440；`--scale=2` → 3840×2160。代码画的文字、线条、SVG 二维码会跟着变清晰。
- 渲染时间大致和像素数成正比：2K ≈ 1080p 的 **1.8 倍**，4K ≈ **4 倍**。
- **原片截取的视频素材不会因此变清晰**（素材本身只有 720p）。要真正清晰，这些片段得改成代码重画。
- 平台会二次压缩：抖音和 B 站对 1080p 以上的码率限制更严，上传前用 crf 14–16 生成高码率母版。

### 10.5 交付前检查（全部通过才发）

```powershell
& $ff -hide_banner -i out\x.mp4 2>&1 | Select-String 'Duration|Stream'   # 时长、分辨率、音轨
& $ff -hide_banner -v error -i out\x.mp4 -f null -                        # 完整解码，无输出 = 正常
& $ff -y -i out\x.mp4 -vn -ac 1 -ar 22050 out\check.wav                   # 抽出成片音频
python -I tools\check_sync.py out\check.wav public\sfx.wav public\bgm.mp3 # 互相关测偏移，应为 0 ms
```

- `check_sync.py`：用互相关分别测音效轨、配乐在成片里的偏移（±300 ms 范围内），应该都是 0.0 ms。
- 复刻任务里如果直接用原视频的音频：成片音频和原音频的相关系数应为 1.0000，偏移为 0。
- 结尾淡出：测最后几百毫秒的响度，应该逐段下降。
- **不要靠“最大能量跃升”来判断同步。** 配乐本身也有起音，会干扰判断；要用互相关。

### 10.6 对比图（复刻时必做）

`tools/compare_sheet.py "帧1,帧2,..." out\cmp`：上面是原片同一时刻，下面是复刻版，每张图放 4 组，逐张对照位置、字号、颜色和节奏。

---

## 11. 复刻已有视频的流程

1. **基本信息**：`ffmpeg -i` 看时长、分辨率、帧率、音轨。
2. **全片结构**：每秒 1 帧拼接触表（`fps=1,scale=480:-1,tile=5x4`），一次看清所有场景。
3. **细看节奏**：4 fps 带时间戳的接触表：
   `fps=4,scale=384:-1,drawtext=fontfile=.../consola.ttf:text='%{pts\:hms}':x=6:y=h-22:fontsize=14:fontcolor=red:box=1:boxcolor=white@0.8,tile=5x4`
4. **切镜检测**：`select='gt(scene,0.25)',showinfo`，解析 `pts_time`。（这类“同一张画布上做动画”的视频切镜很少，主要靠下一步。）
5. **逐帧运动曲线**（`tools/motion_curve.py`）：缩到 192×108 灰度，分别算左半屏、右半屏的相邻帧差，输出每段动作的起止帧。**先把水印区域置零**，避免干扰。
6. **文案**：在每个节拍点把文字区域按原分辨率裁出来，拼图后逐字读取。
7. **配色和尺寸**：用 Pillow 在多帧的固定位置取色（背景各角、标题最深色），沿横线和竖线扫描找元素边缘，再按 1080/原高度 换算坐标。
8. **音频**：直接用原音频时导出无损 `-vn -c:a pcm_s16le -ar 48000 audio.wav`；同时跑 §6 的分析，确认节拍和画面动作的对应关系。
9. **能拿到源项目时**（例如 GitHub 仓库）：GitHub 网页打不开时，`api.github.com` 往往能通。用 `/repos/{o}/{r}` 取信息，`/git/trees/{branch}?recursive=1` 列文件，`/contents/{path}` + 请求头 `Accept: application/vnd.github.raw` 下载原始文件。官方图标、截图、字体比从视频里截的清晰得多。**同时读 README 确认项目当前的名称和信息**。
10. **决定每段怎么做**（先问用户）：代码重画（最清晰，最费时）/ 截原片（快，但受原分辨率限制）/ 混合。
11. **截原片素材**：`crop=宽:高:x:y,scale=...:flags=lanczos,unsharp=5:5:0.6`，**宽高必须是偶数**，用 `-crf 12 -preset slow` 编码。
12. **水印**：原片的平台水印（例如右上角的 B 站标）**绝不复刻**：裁剪素材时避开那个区域，代码重画的角标换成自己的内容。
13. **能做得比原片更好的地方**：二维码改成矢量 SVG（任何分辨率都清晰）、示例正文写原创文字（避开原片里的版权文本）、文字统一用项目自带的字体。

---

## 12. 常见坑速查

| 现象 | 原因 / 解决 |
|---|---|
| 渲染出来动画错乱、跳帧 | 用了 CSS transition 或 animation、setTimeout、无种子的随机数 → 全部改成 frame 的函数 |
| 元素飞出画面、透明度为负 | `interpolate` 没带 clamp |
| 字体首帧是系统默认字体 | 没用 `delayRender` 等字体加载完 |
| `document.fonts.add` 报 TS 类型错误 | 类型断言（§4.6） |
| 视频素材时间对不上 | `OffthreadVideo` 外面没包 `<Sequence from>`，或者截取素材时 `-ss` 起点算错 |
| 爆点感觉“慢半拍” | 画面从重拍帧才开始动 → 提前 3–4 帧起手，让峰值落在重拍帧 |
| 爆点感觉“泄气” | 换气前没收暗或没静止，或者对准了次重音（例如 17.07s 而不是 16.30s） |
| 锚词读不清 | 2–4 个字需要约 0.5 秒才能读完：画面先炸，字在 6–8 帧内落定 |
| 音效削波、爆音 | 没做峰值归一化 → 限制到 0.89 |
| 音效和配乐不和谐 | 音高没从配乐调性里选 |
| npm 装完 esbuild 不能用 | §2.2 第 4 步 |
| 中文日志乱码 | `$env:PYTHONIOENCODING='utf-8'` |
| 下载极慢 | 换 npm 源；不要死等，先测速再决定 |

---

## 13. 给用户的提示词模板（改良版）

用户想自己用一段提示词启动任务时，可以给这一版。它修正了网上流行版本的问题：

```text
帮我做一部知识科普视频，主题：【主题】。
用 Remotion 做，1920×1080，30 帧，16:9 横屏；不配音，用中文字幕把知识点讲清楚；
配乐用文件夹里的音乐，成片控制在 60 秒左右，结尾配乐自然淡出。

① 先逐帧分析这首音乐：BPM、每个重拍和“换气”（重拍前的近静音）在第几帧，
   别信网上流传的时间点，以实测为准。第一个“换气 + 重拍”就是全片第一个高潮。
② 先找“锚词”：2–4 个字，是这个原理落在普通人生活里的处境。
   开头先写观众的处境，不讲历史、不出术语；高潮砸出锚词，结尾重新定义它，最后抛一个人人都能回答的问题。
③ 每个关键动作都配一个用代码合成的音效，音高取自配乐的调；
   画面变化落在重拍或小节线上，冲击动作提前 3–4 帧起手。
④ 画面之间不硬切，用同一个元素贯穿前后两个画面来转场。
⑤ 先做到第一个高潮（约前 20 秒）给我看，确认后再一段一段往下做；
   渲染时每隔一会儿告诉我进度百分比。
⑥ 所有数字必须真实可算。
```

---

## 14. 本工作区文件索引

| 文件 | 作用 |
|---|---|
| `vibe-video/src/binary/*` | 《二分猜数字》：纯黑科普风的完整实现（钩子、爆点、推镜头、漏斗、公式、数字滚动、无限二分结尾） |
| `vibe-video/src/wenku/*` | 《纸面阅读器》：奶白纸面风 App 介绍片（手机框、阅读器、设置面板、书库、推入转场、结尾卡） |
| `vibe-video/src/timeline.json` | 二分视频的时间轴示例 |
| `vibe-video/tools/sfx.py` | 音效合成器（从 timeline.json 读 cue → public/sfx.wav） |
| `vibe-video/tools/analyze_beats.py` | BPM、节拍、强弱拍 → JSON |
| `vibe-video/tools/find_drop.py` | 自动找“换气 + 重拍”候选、结构分段 |
| `vibe-video/tools/precise_15_19.py` | 任意时间段的逐帧响度 / 起音表（参数：文件 起始秒 结束秒） |
| `vibe-video/tools/prep_binary.py` | 调性估计 + 算法步数计算的示例 |
| `vibe-video/tools/check_sync.py` | 成片音画同步检查（互相关） |
| `vibe-video/tools/analyze_ref_audio.py` | 参考视频音频分析（逐秒响度、最强起音、近静音段） |
| `vibe-video/tools/motion_curve.py` | 参考视频逐帧运动曲线（左右分区） |
| `vibe-video/tools/compare_sheet.py` | 原片 / 复刻对比图 |
| `vibe-video/tools/make_qr.py` | 矢量二维码 SVG |
| `your-bgm.mp3` | 你自己准备的配乐（不随仓库分发） |
| 成片 | 两个示例的渲染结果，不随仓库分发 |
