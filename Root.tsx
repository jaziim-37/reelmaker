import {Composition} from 'remotion';
import {CodeReel, Props} from './CodeReel';
import data from './data.json';
import timing from './timing.json';

export const Root = () => (
  <Composition
    id="CodeReel"
    component={CodeReel}
    width={1080}
    height={1920}
    fps={30}
    defaultProps={data as Props}
    durationInFrames={timing.total}
  />
);
