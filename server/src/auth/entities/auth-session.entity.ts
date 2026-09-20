import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('auth_sessions')
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'char', length: 36 })
  userId: string;

  @Column({ name: 'access_hash', type: 'char', length: 64 })
  accessHash: string;

  @Column({ name: 'refresh_hash', type: 'char', length: 64 })
  refreshHash: string;

  @Column({ name: 'access_expires_at', type: 'datetime', precision: 6 })
  accessExpiresAt: Date;

  @Column({ name: 'refresh_expires_at', type: 'datetime', precision: 6 })
  refreshExpiresAt: Date;

  @Column({
    name: 'revoked_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  revokedAt: Date | null;
}
