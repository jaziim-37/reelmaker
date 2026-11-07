"""Check + prepare one reel. Run: python3 tools/build.py  (exit 1 = problem found)."""
import json, math, random, struct, subprocess, sys, wave, os

ROOT = os.path.join(os.path.dirname(__file__), "..")
FPS, START, HOLD, CLIFF = 30, 20, 210, 0
MAX_COLS, MAX_LINES, MAX_HOOK, MAX_OPT = 30, 12, 60, 24
errs = []
def bad(m): errs.append(m)

d = json.load(open(f"{ROOT}/src/data.json", encoding="utf-8"))
for k in ["part","hook","language","code","highlight","caption","result","cliffhanger"]:
    if k not in d: bad(f"missing field: {k}")
if errs: print("\n".join(errs)); sys.exit(1)

code, lines = d["code"], d["code"].split("\n")
# --- character / layout checks
if "\t" in code or "\r" in code: bad("code has tab or CR (breaks typewriter count)")
if len(lines) > MAX_LINES: bad(f"{len(lines)} lines > {MAX_LINES}")
for i, l in enumerate(lines, 1):
    if len(l) > MAX_COLS: bad(f"line {i} is {len(l)} cols > {MAX_COLS} (would be cut off)")
    if l != l.rstrip(): bad(f"line {i} has trailing spaces")
for h in d["highlight"]:
    if not 1 <= h <= len(lines): bad(f"highlight line {h} out of range")
    elif not lines[h-1].strip(): bad(f"highlight line {h} is blank")
if len(d["hook"]) > MAX_HOOK: bad("hook too long")
c = d["cliffhanger"]
for k in ["question","optionA","optionB"]:
    if not c.get(k): bad(f"cliffhanger.{k} empty")
if len(c.get("optionA","")) > MAX_OPT or len(c.get("optionB","")) > MAX_OPT: bad(f"option > {MAX_OPT} chars")
if c.get("optionA") == c.get("optionB"): bad("cliffhanger options identical")
# --- does the code itself run (syntax)?
if d["language"] == "python":
    try: compile(code, "reel", "exec")
    except SyntaxError as e: bad(f"python syntax error line {e.lineno}: {e.msg}")
elif d["language"] in ("javascript","js"):
    r = subprocess.run(["node","--check","-"], input=code, text=True, capture_output=True)
    if r.returncode: bad("js syntax error: " + r.stderr.strip()[:200])
# --- timing (single source of truth)
dur = min(240, max(90, round(len(code) * 1.2)))
total = START + dur + HOLD
# typewriter simulation: reveal must be monotonic, hit every char, finish before hold
prev = -1
for f in range(total):
    t = math.floor(min(max((f-START)/dur, 0), 1) * len(code))
    if t < prev: bad(f"typewriter went backwards at frame {f}")
    prev = t
if prev != len(code): bad("typewriter never finishes the code")
json.dump({"start": START, "type": dur, "total": total}, open(f"{ROOT}/src/timing.json","w"))

# --- sound: keyboard clicks synced to the typed characters
sr, n = 44100, int(total / FPS * 44100)
buf = [0.0] * n
random.seed(7 + d["part"])
visible = [i for i, ch in enumerate(code) if not ch.isspace()]
for i in visible:
    t0 = int((START + dur * i / len(code)) / FPS * sr)
    for j in range(int(0.018 * sr)):
        if t0 + j < n:
            buf[t0+j] += (random.uniform(-1,1) * 0.55 + 0.35*math.sin(2*math.pi*1800*j/sr)) * math.exp(-j/(0.004*sr))
# soft whoosh at result + pop at cliffhanger
for t_f, f0 in [(START+dur+60, 600), (START+dur+120, 440)]:
    t0 = int(t_f / FPS * sr)
    for j in range(int(0.25 * sr)):
        if t0 + j < n: buf[t0+j] += 0.25 * math.sin(2*math.pi*(f0 + j*0.8)*j/sr) * math.exp(-j/(0.08*sr))
peak = max(abs(x) for x in buf) or 1
w = wave.open(f"{ROOT}/public/typing.wav", "wb")
w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes(b"".join(struct.pack("<h", int(max(-1,min(1,x/peak*0.8))*32767)) for x in buf)); w.close()
w = wave.open(f"{ROOT}/public/typing.wav"); a_len = w.getnframes()/w.getframerate(); w.close()
if abs(a_len - total/FPS) > 1/FPS: bad(f"audio {a_len:.2f}s != video {total/FPS:.2f}s")

if errs:
    print("FAILED:\n - " + "\n - ".join(errs)); sys.exit(1)
print(f"OK part {d['part']}: {len(lines)} lines, {len(code)} chars, {total} frames ({total/FPS:.1f}s), audio {a_len:.2f}s")
