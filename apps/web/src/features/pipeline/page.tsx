import React from "react";
import { Pencil, Trash2, GripVertical, MoreHorizontal } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type DragEndEvent } from "@dnd-kit/core";
import { useAppForm, useFormFields } from "@labq-modules/ui/components/forms/use-form-hooks";
import { scrollToFirstError } from "@labq-modules/ui/components/forms/tanstack-form";
import { PageHeader } from "@labq-modules/ui/components/page-header";
import { Button } from "@labq-modules/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@labq-modules/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@labq-modules/ui/components/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@labq-modules/ui/components/dropdown-menu";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanOverlay,
} from "@labq-modules/ui/components/kanban";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@labq-modules/ui/components/empty";
import { ScrollArea, ScrollBar } from "@labq-modules/ui/components/scroll-area";
import { toast } from "sonner";
import { orpc } from "../../runtime";
import { usePermissions } from "../../hooks/use-permissions";
import { EMPTY_STAGE_FORM, STAGE_KIND_OPTIONS } from "../shared/constants";
import { stageFormSchema } from "../shared/form-schemas";
import type { DealRow, StageFormValues, StageRow } from "../shared/types";

interface DialogFormApi {
  AppForm: React.ComponentType<{ children?: React.ReactNode }>;
  Form: React.ComponentType<{ children?: React.ReactNode }>;
  SubmitButton: React.ComponentType<{ children?: React.ReactNode }>;
}

function StageFormDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: DialogFormApi;
}) {
  const { FormTextField, FormSelectField } = useFormFields<StageFormValues>();
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <props.form.AppForm>
          <props.form.Form>
            <div className="space-y-4">
              <FormTextField name="name" label="Stage name" required />
              <FormSelectField name="kind" label="Stage type" options={STAGE_KIND_OPTIONS} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
                Cancel
              </Button>
              <props.form.SubmitButton>Save</props.form.SubmitButton>
            </DialogFooter>
          </props.form.Form>
        </props.form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

export function PipelinePage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StageRow | null>(null);
  const [retiring, setRetiring] = React.useState<StageRow | null>(null);

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: orpc.crm.stages.list.queryKey({ input: { includeRetired: false } }),
      }),
      queryClient.invalidateQueries({ queryKey: orpc.crm.deals.list.queryKey({ input: {} }) }),
      queryClient.invalidateQueries({ queryKey: orpc.crm.summary.queryKey() }),
    ]);
  };

  const form = useAppForm({
    defaultValues: EMPTY_STAGE_FORM,
    validators: { onSubmit: stageFormSchema },
    onSubmitInvalid: () => scrollToFirstError(),
    onSubmit: async ({ value }) => {
      const payload = { name: value.name, kind: value.kind };
      if (editing) {
        await updateStage.mutateAsync({ id: editing.id, ...payload });
        return;
      }
      await createStage.mutateAsync(payload);
    },
  });

  const { data: stagesData, isLoading: stagesLoading } = useQuery(
    orpc.crm.stages.list.queryOptions({ input: { includeRetired: false } }),
  );
  const stages = React.useMemo(
    () => ((stagesData as StageRow[] | undefined) ?? []) as StageRow[],
    [stagesData],
  );

  const { data: dealsData, isLoading: dealsLoading } = useQuery(
    orpc.crm.deals.list.queryOptions({
      input: { page: 1, pageSize: 200 },
    }),
  );
  const allDeals = React.useMemo(
    () => ((dealsData as { items?: DealRow[] } | undefined)?.items ?? []) as DealRow[],
    [dealsData],
  );
  const isLoading = stagesLoading || dealsLoading;

  const dealsByStage = React.useMemo(() => {
    const grouped: Record<string, DealRow[]> = {};
    for (const stage of stages) grouped[stage.id] = [];
    for (const deal of allDeals) {
      if (deal.stageId && grouped[deal.stageId]) {
        grouped[deal.stageId]!.push(deal);
      }
    }
    return grouped;
  }, [stages, allDeals]);

  const createStage = useMutation(
    orpc.crm.stages.create.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Stage created");
        setDialogOpen(false);
        form.reset(EMPTY_STAGE_FORM);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateStage = useMutation(
    orpc.crm.stages.update.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Stage updated");
        setDialogOpen(false);
        setEditing(null);
        form.reset(EMPTY_STAGE_FORM);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const retireStage = useMutation(
    orpc.crm.stages.retire.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Stage retired");
        setRetiring(null);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const reorderStage = useMutation(
    orpc.crm.stages.reorder.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Order updated");
      },
      onError: (error) => {
        liveValueRef.current = committedValueRef.current;
        setKanbanValue(committedValueRef.current);
        toast.error(error.message);
      },
    }),
  );

  const moveDeal = useMutation(
    orpc.crm.deals.update.mutationOptions({
      onSuccess: async () => {
        await invalidate();
      },
      onError: (error) => {
        liveValueRef.current = committedValueRef.current;
        setKanbanValue(committedValueRef.current);
        toast.error(error.message);
      },
    }),
  );

  const openCreate = () => {
    setEditing(null);
    form.reset(EMPTY_STAGE_FORM);
    setDialogOpen(true);
  };
  const openCreateRef = React.useRef(openCreate);
  openCreateRef.current = openCreate;

  const openEdit = (stage: StageRow) => {
    setEditing(stage);
    form.reset({ name: stage.name, kind: stage.kind });
    setDialogOpen(true);
  };

  // Kanban visual state — tracks drag preview before server confirms
  const [kanbanValue, setKanbanValue] = React.useState<Record<string, DealRow[]>>({});
  const committedValueRef = React.useRef(kanbanValue);
  const liveValueRef = React.useRef<Record<string, DealRow[]>>(dealsByStage);

  React.useEffect(() => {
    liveValueRef.current = dealsByStage;
    setKanbanValue(dealsByStage);
  }, [dealsByStage]);

  const visibleDealsByStage = React.useMemo(
    () => (Object.keys(kanbanValue).length > 0 ? kanbanValue : dealsByStage),
    [kanbanValue, dealsByStage],
  );

  const stageById = React.useMemo(
    () => new Map(stages.map((stage) => [stage.id, stage] as const)),
    [stages],
  );

  const findColumnForDeal = React.useCallback(
    (columns: Record<string, DealRow[]>, dealId: string) =>
      Object.entries(columns).find(([, items]) => items.some((item) => item.id === dealId))?.[0],
    [],
  );

  const handleValueChange = React.useCallback((nextValue: Record<string, DealRow[]>) => {
    liveValueRef.current = nextValue;
    setKanbanValue(nextValue);
  }, []);

  const handleDragStart = () => {
    committedValueRef.current = liveValueRef.current;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const committed = committedValueRef.current;
    const current = liveValueRef.current;
    const activeId = active.id as string;
    const overId = over.id as string;

    // Column reorder
    if (activeId in committed) {
      const keys = Object.keys(current);
      const oldIndex = keys.indexOf(activeId);
      const newIndex = keys.indexOf(overId);
      if (oldIndex !== newIndex && newIndex >= 0) {
        const reordered = [...keys];
        reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, activeId);
        reorderStage.mutate({ stageIds: reordered });
      }
      return;
    }

    const oldColumnId = findColumnForDeal(committed, activeId);
    if (!oldColumnId) return;

    const newColumnId =
      findColumnForDeal(current, activeId) ??
      (overId in current ? overId : findColumnForDeal(current, overId));

    if (!newColumnId || oldColumnId === newColumnId) return;

    const deal = allDeals.find((item) => item.id === activeId);
    if (!deal) return;

    moveDeal.mutate({
      id: activeId,
      title: deal.title,
      stageId: newColumnId,
      companyId: deal.companyId ?? undefined,
      contactId: deal.contactId ?? undefined,
      value: deal.value ? Number(deal.value) : undefined,
      expectedCloseDate: deal.expectedCloseDate ?? undefined,
      notes: deal.notes ?? undefined,
    });
  };

  // Keyboard shortcut: Cmd/Ctrl+N to create stage
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        if (!dialogOpen && !retiring) openCreateRef.current();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen, retiring]);

  return (
    <main className="flex h-full flex-1 flex-col gap-6">
      <div className="px-6 pt-6">
        <PageHeader
          title="Pipeline"
          subtitle="Manage stages and move deals between them."
          actions={
            hasPermission("crm.update") ? (
              <Button onClick={openCreate}>Add stage</Button>
            ) : undefined
          }
        />
      </div>
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-72 min-w-72 space-y-3">
              <div className="h-12 animate-pulse rounded-xl bg-muted" />
              <div className="space-y-2">
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
                <div className="h-20 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : stages.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon" />
            <EmptyTitle>No pipeline stages</EmptyTitle>
            <EmptyDescription>
              Create your first stage to start organizing deals through your pipeline.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {hasPermission("crm.update") && <Button onClick={openCreate}>Add stage</Button>}
          </EmptyContent>
        </Empty>
      ) : (
        <Kanban
          key={`pipeline-${Object.keys(visibleDealsByStage).join(",")}`}
          value={visibleDealsByStage}
          onValueChange={handleValueChange}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          getItemValue={(deal) => deal.id}
        >
          <ScrollArea className="w-full flex-1">
            <KanbanBoard className="w-max pb-4 px-6">
              {Object.keys(visibleDealsByStage).map((stageId) => {
                const stage = stageById.get(stageId);
                if (!stage) return null;
                const stageDeals = visibleDealsByStage[stage.id] ?? [];
                return (
                  <KanbanColumn key={stage.id} value={stage.id} className="w-72 shrink-0 gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <KanbanColumnHandle className="text-muted-foreground hover:text-foreground shrink-0">
                          <GripVertical className="size-4" />
                        </KanbanColumnHandle>
                        <span className="text-sm font-medium truncate">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {stageDeals.length}
                        </span>
                        {hasPermission("crm.update") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              }
                            >
                              <span className="sr-only">Actions</span>
                              <MoreHorizontal className="size-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(stage);
                                }}
                              >
                                <Pencil className="size-3.5" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (stageDeals.length > 0) {
                                    toast.error("Move active deals before retiring this stage.");
                                    return;
                                  }
                                  setRetiring(stage);
                                }}
                              >
                                <Trash2 className="size-3.5" />
                                <span>Retire</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    {stageDeals.map((deal) => (
                      <KanbanItem
                        key={deal.id}
                        value={deal.id}
                        asHandle
                        className="rounded-lg border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md"
                      >
                        <p className="font-medium text-sm">{deal.title}</p>
                        {deal.value && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Rp {Number(deal.value).toLocaleString("id-ID")}
                          </p>
                        )}
                      </KanbanItem>
                    ))}
                  </KanbanColumn>
                );
              })}
            </KanbanBoard>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <KanbanOverlay>
            {({ value, variant }) => {
              if (variant === "column") {
                const stage = stageById.get(value as string);
                if (!stage) return null;
                const stageDeals = visibleDealsByStage[stage.id] ?? [];
                return (
                  <div className="flex w-72 flex-col gap-3 rounded-lg border bg-zinc-100 p-2.5 opacity-90 dark:bg-zinc-900">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">{stage.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {stageDeals.length}
                      </span>
                    </div>
                    {stageDeals.slice(0, 2).map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-lg border bg-card p-3 text-sm shadow-sm"
                      >
                        <p className="font-medium text-sm">{deal.title}</p>
                      </div>
                    ))}
                    {stageDeals.length > 2 && (
                      <div className="text-center text-xs text-muted-foreground py-1">
                        +{stageDeals.length - 2} more
                      </div>
                    )}
                  </div>
                );
              }
              const deal = allDeals.find((item) => item.id === value);
              if (!deal) return null;
              return (
                <div className="rounded-lg border bg-card p-3 text-sm shadow-md opacity-90">
                  <p className="font-medium text-sm">{deal.title}</p>
                  {deal.value && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Rp {Number(deal.value).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              );
            }}
          </KanbanOverlay>
        </Kanban>
      )}

      <StageFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            form.reset(EMPTY_STAGE_FORM);
          }
        }}
        title={editing ? "Edit stage" : "New stage"}
        form={form}
      />

      <AlertDialog
        open={!!retiring}
        onOpenChange={(open) => {
          if (!open) setRetiring(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retire stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to retire &ldquo;{retiring?.name}&rdquo;? This stage will be
              removed from the pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              isLoading={retireStage.isPending}
              onClick={() => {
                if (retiring) retireStage.mutate({ id: retiring.id });
              }}
            >
              Retire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
