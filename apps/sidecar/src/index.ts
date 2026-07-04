import { createApp } from './app.js';
import { SIDECAR_DEFAULT_PORT } from '@operon/shared-types';

const port = Number(process.env.OPERON_SIDECAR_PORT ?? SIDECAR_DEFAULT_PORT);
const dataDir = process.env.OPERON_DATA_DIR;

const app = createApp({ dataDir });
app.listen(port, () => {
  console.log(`Operon sidecar listening on http://127.0.0.1:${port}`);
});
