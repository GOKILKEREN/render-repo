const {execFileSync} = require('node:child_process');

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/qa-ffprobe.js FILE');
  process.exit(2);
}

const raw = execFileSync('ffprobe', [
  '-v', 'error',
  '-print_format', 'json',
  '-show_streams',
  '-show_format',
  file,
], {encoding: 'utf8'});

const data = JSON.parse(raw);
const video = data.streams.find((s) => s.codec_type === 'video');
const audio = data.streams.find((s) => s.codec_type === 'audio');
const duration = Number(data.format.duration || 0);
const failures = [];

if (!video) failures.push('missing video stream');
if (!audio) failures.push('missing audio stream');
if (video && video.width !== 1080) failures.push(`width ${video.width}`);
if (video && video.height !== 1920) failures.push(`height ${video.height}`);
if (video) {
  const [num, den] = (video.avg_frame_rate || '0/1').split('/').map(Number);
  const fps = den ? num / den : 0;
  if (Math.abs(fps - 30) > 0.01) failures.push(`fps ${fps}`);
}
if (duration < 120 || duration > 180) failures.push(`duration ${duration}`);

console.log(JSON.stringify({
  file,
  width: video && video.width,
  height: video && video.height,
  fps: video && video.avg_frame_rate,
  duration,
  audio: Boolean(audio),
  failures,
}, null, 2));

process.exit(failures.length ? 1 : 0);
