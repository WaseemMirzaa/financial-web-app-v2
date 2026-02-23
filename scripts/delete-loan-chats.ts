import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function deleteLoanChats() {
  const { default: pool } = await import('../src/lib/db');
  try {
    const [rows] = await pool.query(
      'SELECT id FROM chats WHERE loan_id IS NOT NULL'
    ) as any[];
    const ids = rows.map((r: any) => r.id);
    if (ids.length === 0) {
      console.log('No loan chats found.');
      return;
    }
    for (const id of ids) {
      await pool.query('DELETE FROM chat_read_status WHERE chat_id = ?', [id]);
      await pool.query('DELETE FROM chat_messages WHERE chat_id = ?', [id]);
      await pool.query('DELETE FROM chat_participants WHERE chat_id = ?', [id]);
      await pool.query('DELETE FROM chats WHERE id = ?', [id]);
    }
    console.log(`Deleted ${ids.length} loan chat(s).`);
  } finally {
    await pool.end();
  }
}

deleteLoanChats().catch((e) => {
  console.error(e);
  process.exit(1);
});
