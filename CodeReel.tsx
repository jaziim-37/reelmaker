import {AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import timing from './timing.json';
import {Highlight, themes} from 'prism-react-renderer';

export type Props = {
  hook: string;
  language: string;
  code: string;
  highlight: number[]; // 1-based line numbers
  caption: string;
  result: string;
  part?: number;
  cliffhanger: {question: string; optionA: string; optionB: string};
};

export const CodeReel = ({hook, language, code, highlight, caption, result, cliffhanger}: Props) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const start = timing.start;
  const dur = timing.type;
  const typed = Math.floor(interpolate(frame, [start, start + dur], [0, code.length], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }));
  const done = frame >= start + dur;
  const after = frame - (start + dur);

  const hookIn = spring({frame, fps, config: {damping: 14}});
  const win = spring({frame: frame - 5, fps, config: {damping: 16}});
  const glow = done ? interpolate(after, [0, 20], [0, 1], {extrapolateRight: 'clamp'}) : 0;
  const capIn = done ? spring({frame: after - 10, fps}) : 0;
  const resIn = done ? spring({frame: after - 60, fps, config: {damping: 12}}) : 0;
  const zoom = 1 + (done ? interpolate(after, [0, 90], [0, 0.04], {extrapolateRight: 'clamp'}) : 0);
  const bgShift = interpolate(frame, [0, 300], [0, 60]);
  const cliffIn = done ? spring({frame: after - 120, fps, config: {damping: 13}}) : 0;
  const optB = done ? spring({frame: after - 135, fps, config: {damping: 13}}) : 0;

  let counter = 0;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${150 + bgShift}deg, #0f0c29, #302b63 55%, #24243e)`,
      fontFamily: 'Inter, Helvetica, Arial, sans-serif', alignItems: 'center',
    }}>
      <Audio src={staticFile('typing.wav')} />
      {/* Hook */}
      <div style={{
        marginTop: 140, padding: '0 70px', textAlign: 'center', color: 'white',
        fontSize: 72, fontWeight: 800, lineHeight: 1.15,
        opacity: hookIn, transform: `translateY(${(1 - hookIn) * -60}px)`,
      }}>{hook}</div>

      {/* Window */}
      <div style={{
        marginTop: 110, width: 940, borderRadius: 28, background: '#1e1e2e',
        boxShadow: '0 40px 120px rgba(124,92,255,0.45)', overflow: 'hidden',
        opacity: win, transform: `scale(${win * zoom})`,
      }}>
        <div style={{display: 'flex', gap: 14, padding: '26px 30px', background: '#181825'}}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{width: 24, height: 24, borderRadius: 12, background: c}} />
          ))}
        </div>
        <div style={{padding: '30px 0 40px'}}>
          <Highlight theme={themes.vsDark} code={code} language={language}>
            {({tokens, getTokenProps}) => (
              <pre style={{margin: 0, fontFamily: 'Menlo, Consolas, monospace', fontSize: 44, lineHeight: 1.5}}>
                {tokens.map((line, li) => {
                  const hl = highlight.includes(li + 1);
                  return (
                    <div key={li} style={{
                      padding: '0 40px', minHeight: 66,
                      opacity: done && !hl ? 1 - 0.55 * glow : 1,
                      background: hl ? `rgba(124,92,255,${0.28 * glow})` : 'transparent',
                      borderLeft: `6px solid ${hl ? `rgba(160,130,255,${glow})` : 'transparent'}`,
                    }}>
                      {line.map((token, ti) => {
                        const text = token.content;
                        const visible = Math.max(0, Math.min(text.length, typed - counter));
                        counter += text.length;
                        if (visible === 0) return null;
                        return <span key={ti} {...getTokenProps({token})}>{text.slice(0, visible)}</span>;
                      })}
                      {(() => {
                        // newline counts as 1 char
                        counter += 1;
                        return null;
                      })()}
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        </div>
      </div>

      {/* Caption */}
      <div style={{
        marginTop: 70, padding: '18px 40px', borderRadius: 20, background: 'rgba(255,255,255,0.1)',
        color: '#e0d9ff', fontSize: 46, fontWeight: 600, opacity: capIn,
        transform: `translateY(${(1 - capIn) * 40}px)`,
      }}>{caption}</div>

      {/* Result */}
      <div style={{
        marginTop: 50, color: '#5cffb1', fontSize: 58, fontWeight: 800,
        opacity: resIn, transform: `scale(${0.8 + 0.2 * resIn})`,
      }}>✅ {result}</div>
      {/* Cliffhanger */}
      <AbsoluteFill style={{
        background: 'rgba(8,6,24,0.88)', justifyContent: 'center', alignItems: 'center',
        padding: '0 70px', opacity: cliffIn, pointerEvents: 'none',
      }}>
        <div style={{color: 'white', fontSize: 70, fontWeight: 800, textAlign: 'center', lineHeight: 1.2,
          transform: `scale(${0.85 + 0.15 * cliffIn})`}}>{cliffhanger.question}</div>
        {[['A', cliffhanger.optionA, cliffIn], ['B', cliffhanger.optionB, optB]].map(([k, t, p]) => (
          <div key={k as string} style={{
            marginTop: 60, width: 880, padding: '34px 40px', borderRadius: 28, fontSize: 54, fontWeight: 700,
            color: 'white', background: k === 'A' ? 'rgba(124,92,255,0.5)' : 'rgba(255,92,160,0.5)',
            border: '3px solid rgba(255,255,255,0.35)', opacity: p as number,
            transform: `translateY(${(1 - (p as number)) * 60}px)`,
          }}>{k as string}) {t as string}</div>
        ))}
        <div style={{marginTop: 70, color: '#bdb4ff', fontSize: 44, fontWeight: 600}}>Comment A or B 👇</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
