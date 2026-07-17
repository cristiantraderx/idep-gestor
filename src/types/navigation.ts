import { LucideIcon } from "lucide-react";

export interface SubNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface NavSection {
  type: "section";
  label: string;
}

export interface NavItem {
  type: "item";
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  subItems?: SubNavItem[];
}

export type NavEntry = NavSection | NavItem;

export type UserRole =
  | "admin_geral"
  | "diretor"
  | "coordenador"
  | "supervisor"
  | "secretaria"
  | "professor"
  | "aluno"
  | "rh"
  | "financeiro"
  | "compras"
  | "almoxarifado"
  | "patrimonio"
  | "biblioteca"
  | "ti"
  | "ouvidoria"
  | "auditoria"
  | "visitante";

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  activeSection: string;
  openSubMenus: string[];
}
