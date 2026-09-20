import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('auth_login_attempts')
export class LoginAttempt {
  @PrimaryColumn({ name: 'email_hash', type: 'char', length: 64 })
  emailHash: string;

  @Column({ name: 'failed_count', type: 'int', default: 0 })
  failedCount: number;

  @Column({
    name: 'window_started_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  windowStartedAt: Date | null;

  @Column({
    name: 'locked_until',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  lockedUntil: Date | null;
}
