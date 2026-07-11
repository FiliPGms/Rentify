import cron from 'node-cron';
import { atualizarAtrasos } from '../services/conta-service.js';

export function startAtrasosJob(): void {
  cron.schedule('5 0 * * *', async () => {
    await atualizarAtrasos();
  });
}
