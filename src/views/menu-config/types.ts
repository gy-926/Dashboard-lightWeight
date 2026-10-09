import type { MenuRecord, MenuRootRecord } from '@/api/dashboard-admin';
import type { DashboardFunctionRecord } from '@/api/dashboard-functions';

export type MenuRootRow = MenuRootRecord;
export type MenuRow = MenuRecord;
export type FunctionRow = DashboardFunctionRecord;

export interface TreeNodeData {
  id: string;
  label: string;
  type?: 'folder' | 'page';
  children?: TreeNodeData[];
  parentId?: string | null;
  raw?: MenuRootRow | MenuRow | null;
  __isNew?: boolean;
  __parentKvid?: string | null;
  __rootKvid?: string;
  __entityKind?: 'root' | 'menu';
}

export interface FlatTreeItem {
  node: TreeNodeData;
  depth: number;
  hasChildren: boolean;
  open: boolean;
}

export interface Param {
  name: string;
  value: string;
}

export interface FnItem {
  Kvid: string;
  DisplayName: string;
  SortId: number;
  Icon: string;
  Parameters: Param[];
  Remark: string;
  Handler?: string;
  FunctionKvid?: string;
  FunctionName?: string;
  __raw?: MenuRow;
  __editing?: '' | 'name' | 'sort' | 'icon' | 'remark';
  __saving?: boolean;
  __snapshot?: {
    DisplayName: string;
    SortId: number;
    Icon: string;
    Remark: string;
    ParametersText: string;
  };
}
