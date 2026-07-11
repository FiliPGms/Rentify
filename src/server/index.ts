import { env } from './config/env.js';
import { createApp } from './app.js';
import { startAtrasosJob } from './jobs/atrasos-job.js';

const app = createApp();

app.listen(env.PORT, () => {
  startAtrasosJob();
  console.log(`API listening on http://localhost:${env.PORT}`);
});
