import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================
// useCrud — Hook genérico para operações CRUD com Supabase
// Elimina a repetição de fetchData, handleSave, handleDelete,
// estados de loading/modal/deleteConfirm em todas as páginas
// ============================================================

export interface CrudRefConfig {
  /** Chave para acessar os dados de referência */
  key: string;
  /** Nome da tabela no Supabase */
  table: string;
  /** Colunas para selecionar */
  select?: string;
  /** Filtro estático (ex: { ativo: true }) */
  filter?: Record<string, unknown>;
  /** Ordenação */
  order?: { column: string; ascending?: boolean };
}

export interface CrudConfig<T extends { id: string }> {
  /** Nome da tabela principal no Supabase */
  table: string;
  /** Colunas para selecionar (padrão: "*") */
  select?: string;
  /** Ordenação padrão */
  order?: { column: string; ascending?: boolean };
  /** Join com outras tabelas (ex: "unidades(nome, sigla)") */
  join?: string;
  /** Função para mapear cada row vinda do Supabase para o tipo T */
  mapRow?: (row: unknown) => T;
  /** Tabelas de referência para carregar em paralelo (ex: unidades, perfis) */
  refs?: CrudRefConfig[];
}

export interface UseCrudReturn<T extends { id: string }> {
  // Dados
  data: T[];
  loading: boolean;
  /** Dados de referência carregados em paralelo (acessar via refs[key]) */
  refs: Record<string, unknown[]>;

  // Estado do modal de create/edit
  modalOpen: boolean;
  editing: T | null;
  saving: boolean;
  formError: string;

  // Estado do modal de exclusão
  deleteConfirm: string | null;

  // Ações
  fetchData: () => Promise<void>;
  openCreate: () => void;
  openEdit: (item: T) => void;
  closeModal: () => void;
  save: (payload: Record<string, unknown>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  setFormError: (error: string) => void;
  setDeleteConfirm: (id: string | null) => void;
}

export function useCrud<T extends { id: string }>(
  config: CrudConfig<T>
): UseCrudReturn<T> {
  const {
    table,
    select = "*",
    order,
    join,
    mapRow,
    refs: refConfigs = [],
  } = config;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refs, setRefs] = useState<Record<string, unknown[]>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Query principal com join opcional
      const query = join
        ? supabase.from(table).select(`${select}, ${join}`)
        : supabase.from(table).select(select);

      if (order) {
        query.order(order.column, { ascending: order.ascending ?? true });
      }

      const [mainRes, ...refResults] = await Promise.all([
        query,
        ...refConfigs.map((ref) => {
          let refQuery = supabase.from(ref.table).select(ref.select || select);
          if (ref.filter) {
            Object.entries(ref.filter).forEach(([k, v]) => {
              refQuery = refQuery.eq(k, v as string | boolean | number);
            });
          }
          if (ref.order) {
            refQuery = refQuery.order(ref.order.column, {
              ascending: ref.order.ascending ?? true,
            });
          }
          return refQuery;
        }),
      ]);

      if (mainRes.data) {
        const mapped = mapRow
          ? mainRes.data.map((row: unknown) => mapRow(row))
          : (mainRes.data as unknown as T[]);
        setData(mapped);
      }

      // Processa resultados de referência
      const refsMap: Record<string, unknown[]> = {};
      refConfigs.forEach((ref, idx) => {
        const res = refResults[idx];
        if (res?.data) {
          refsMap[ref.key] = res.data;
        }
      });
      setRefs(refsMap);
    } catch (err) {
      console.error(`[useCrud] Erro ao carregar dados de "${table}":`, err);
    } finally {
      setLoading(false);
    }
  }, [table, select, order, join, mapRow, refConfigs]);

  // Carrega dados na montagem
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) fetchData();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormError("");
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditing(item);
    setFormError("");
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
    setFormError("");
  }, []);

  const save = useCallback(
    async (payload: Record<string, unknown>): Promise<boolean> => {
      setFormError("");
      setSaving(true);
      try {
        if (editing) {
          const { error } = await supabase
            .from(table)
            .update(payload)
            .eq("id", editing.id);
          if (error) {
            setFormError(error.message);
            return false;
          }
        } else {
          const { error } = await supabase.from(table).insert(payload);
          if (error) {
            setFormError(error.message);
            return false;
          }
        }
        closeModal();
        fetchData();
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao salvar";
        setFormError(message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [table, editing, closeModal, fetchData]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (!error) {
        setData((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirm(null);
        return true;
      }
      console.error(`[useCrud] Erro ao excluir de "${table}":`, error);
      return false;
    },
    [table]
  );

  return {
    data,
    loading,
    refs,
    modalOpen,
    editing,
    saving,
    formError,
    deleteConfirm,
    fetchData,
    openCreate,
    openEdit,
    closeModal,
    save,
    remove,
    setFormError,
    setDeleteConfirm,
  };
}
