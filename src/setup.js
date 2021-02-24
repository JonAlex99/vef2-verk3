import { readFile } from 'fs';
import util from 'util';
import faker from 'faker';
import { query, end } from './db.js';

const schemaFile = './sql/schema.sql';
const readFileAsync = util.promisify(readFile);

async function mock(n) {
  for (let i = 0; i < n; i++) {
    const name = faker.name.findName();
    const kt = Math.floor(Math.random() * 9000000000) + 1000000000;
    let ath = '';
    if (Math.random() < 0.5) ath = faker.lorem.sentence();
    let nafnlaus = false;
    if (Math.random() < 0.5) nafnlaus = true;
    let sign = Date.now();
    sign -= Math.floor(Math.random() * (1.21 * (10 ** 9)));
    sign = new Date(sign).toISOString().slice(0, 19).replace('T', ' ');

    const q = `
      INSERT INTO signatures (name, nationalId, comment, anonymous, signed)
      VALUES ($1, $2, $3, $4, $5)`;

    await query(q, [name, kt, ath, nafnlaus, sign]);
  }
}

async function create() {
  const data = await readFileAsync(schemaFile);

  await query(data.toString('utf-8'));

  console.info('Schema created');

  await mock(500);

  console.info('Mock data inserted');

  await end();
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
