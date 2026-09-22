import 'dotenv/config';
import readline from 'readline';
import { db } from '../server/db/database';

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return args;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const email = args.email || (await prompt('Admin email: '));
  const password = args.password || (await prompt('Admin password: '));
  const name = args.name || (await prompt('Admin name (default: System Admin): ')) || 'System Admin';

  if (!email || !password) {
    console.error('Email and password are required.');
    process.exitCode = 1;
    return;
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exitCode = 1;
    return;
  }

  // Give the embedded/PostgreSQL connection a moment to initialize.
  await new Promise(resolve => setTimeout(resolve, 500));

  const { created, user } = await db.createAdminUser(email, password, name);

  if (created) {
    console.log(`Admin account created: ${user.email} (id: ${user.id})`);
  } else {
    console.log(`An account with email ${user.email} already exists (role: ${user.role}). No changes made.`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Failed to create admin account:', err);
  process.exit(1);
});
