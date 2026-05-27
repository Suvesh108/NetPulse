const SpeedTestModule = require('@cloudflare/speedtest');
const SpeedTest = SpeedTestModule.default;

const test = new SpeedTest({
  autoStart: false,
  measureDownloadLoadedLatency: false,
  measureUploadLoadedLatency: false
});

// Do not define onPhaseChange to see if it throws!
test.onResultsChange = ({ type }) => {
  console.log(`Results change: ${type}`);
};

test.onFinish = (r) => {
  console.log('Finished successfully');
  process.exit(0);
};

test.onError = (e) => {
  console.error('Error:', e);
  process.exit(1);
};

console.log('Playing test without onPhaseChange...');
test.play();
