import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { User } from '@operon/shared-types';

export class UserRepo {
  constructor(private readonly db: Database.Database) {}

  getOwner(): User | null {
    const row = this.db
      .prepare(
        `SELECT id, display_name AS displayName, created_at AS createdAt, updated_at AS updatedAt
         FROM users LIMIT 1`,
      )
      .get() as User | undefined;
    return row ?? null;
  }

  create(input: { displayName: string }): User {
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      displayName: input.displayName,
      createdAt: now,
      updatedAt: now,
    };
    this.db
      .prepare(
        `INSERT INTO users (id, display_name, pin_hash, created_at, updated_at)
         VALUES (@id, @displayName, NULL, @createdAt, @updatedAt)`,
      )
      .run(user);
    return user;
  }
}

export function seedDefaultOwner(db: Database.Database): User {
  const repo = new UserRepo(db);
  return repo.getOwner() ?? repo.create({ displayName: 'Owner' });
}
