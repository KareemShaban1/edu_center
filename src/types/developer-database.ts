export type DbTableScoping = 'platform' | 'center' | 'membership';

export interface DbColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  primary: boolean;
  unique: boolean;
  indexed: boolean;
  autoIncrement: boolean;
}

export interface DbIndexDefinition {
  name?: string;
  columns: string[];
  unique: boolean;
  primary?: boolean;
}

export interface DbForeignKeyDefinition {
  column: string;
  referencesTable: string;
  referencesColumn: string;
  onDelete?: string;
  onUpdate?: string;
}

export interface DbIncomingReference {
  fromTable: string;
  column: string;
  referencesColumn: string;
  onDelete?: string;
}

export interface DbTableDefinition {
  name: string;
  createMigration: string;
  migrations: string[];
  columns: DbColumnDefinition[];
  indexes: DbIndexDefinition[];
  foreignKeys: DbForeignKeyDefinition[];
  referencedBy: DbIncomingReference[];
  scoping: DbTableScoping;
  membershipModel?: string;
  columnCount: number;
  indexCount: number;
  foreignKeyCount: number;
  incomingCount: number;
}

export interface DatabaseSchemaCatalog {
  syncedAt: string;
  tableCount: number;
  centerScopedCount: number;
  membershipScopedCount: number;
  tables: DbTableDefinition[];
}
