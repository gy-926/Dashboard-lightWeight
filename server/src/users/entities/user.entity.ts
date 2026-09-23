import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  User = 'user',
  SuperAdmin = 'super_admin',
}

// 将此 TypeScript 类映射为 MySQL 的 users 表。
@Entity('users')
export class User {
  // UUID 主键；由 TypeORM 在创建用户时自动生成字符串 UUID。
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 用户显示名称；数据库列最长 100 个字符。
  @Column({ length: 100 })
  name: string;

  // 用户邮箱；数据库层面的 UNIQUE 约束是并发写入时的最终防线。
  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role: UserRole;

  @Column({ name: 'department_id', type: 'char', length: 36, nullable: true })
  departmentId: string | null;

  // 旧账号暂时没有密码，不能登录；查询用户时不读取此列。
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordHash: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;
}
