import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppForm, useFormFields } from "@labq-modules/ui/components/forms/use-form-hooks";
import { scrollToFirstError } from "@labq-modules/ui/components/forms/tanstack-form";
import { Badge } from "@labq-modules/ui/components/badge";
import { Button } from "@labq-modules/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@labq-modules/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@labq-modules/ui/components/dialog";
import { Separator } from "@labq-modules/ui/components/separator";
import { toast } from "sonner";
import { orpc } from "../../../runtime";
import { usePermissions } from "../../../hooks/use-permissions";
import { ACTIVITY_TYPE_OPTIONS, EMPTY_ACTIVITY_FORM } from "../constants";
import { activityFormSchema } from "../form-schemas";
import type { ActivityFormValues, ActivityRow } from "../types";

interface ActivityTimelineProps {
  entityType: "lead" | "contact" | "company" | "deal";
  entityId: string;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ActivityRow | null>(null);

  const form = useAppForm({
    defaultValues: EMPTY_ACTIVITY_FORM,
    validators: { onSubmit: activityFormSchema },
    onSubmitInvalid: () => scrollToFirstError(),
    onSubmit: async ({ value }) => {
      const payload = {
        type: value.type,
        title: value.title,
        details: value.details || undefined,
        dueAt: value.dueAt || undefined,
        occurredAt: value.occurredAt || undefined,
        completed: value.completed,
      };
      if (editing) {
        await updateActivity.mutateAsync({ id: editing.id, ...payload });
        return;
      }
      await createActivity.mutateAsync({ entityType, entityId, ...payload });
    },
  });
  const {
    FormSelectField,
    FormTextField,
    FormTextareaField,
    FormDatePickerField,
    FormCheckboxField,
  } = useFormFields<ActivityFormValues>();

  const { data } = useQuery(
    orpc.crm.activities.list.queryOptions({ input: { entityType, entityId } }),
  );
  const activities = ((data as ActivityRow[] | undefined) ?? []) as ActivityRow[];

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: orpc.crm.activities.list.queryKey({ input: { entityType, entityId } }),
      }),
      queryClient.invalidateQueries({
        queryKey: orpc.crm.summary.queryKey(),
      }),
    ]);
  };

  const createActivity = useMutation(
    orpc.crm.activities.create.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Activity added");
        setDialogOpen(false);
        setEditing(null);
        form.reset(EMPTY_ACTIVITY_FORM);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateActivity = useMutation(
    orpc.crm.activities.update.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Activity updated");
        setDialogOpen(false);
        setEditing(null);
        form.reset(EMPTY_ACTIVITY_FORM);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteActivity = useMutation(
    orpc.crm.activities.softDelete.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Activity deleted");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const openCreate = () => {
    setEditing(null);
    form.reset(EMPTY_ACTIVITY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (activity: ActivityRow) => {
    setEditing(activity);
    form.reset({
      type: activity.type,
      title: activity.title,
      details: activity.details ?? "",
      dueAt: activity.dueAt ?? "",
      occurredAt: activity.occurredAt ?? "",
      completed: !!activity.completedAt,
    });
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Activities</CardTitle>
          </div>
          {hasPermission("crm.update") && (
            <Button size="sm" variant="outline" onClick={openCreate}>
              Add activity
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground">No activities yet.</p>
          )}
          {activities.map((activity, index) => (
            <div key={activity.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {ACTIVITY_TYPE_OPTIONS.find((item) => item.value === activity.type)?.label ??
                        activity.type}
                    </Badge>
                    {activity.completedAt && <Badge>Completed</Badge>}
                  </div>
                  <p className="font-medium">{activity.title}</p>
                  {activity.details && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {activity.details}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Occurred: {formatDate(activity.occurredAt)}</span>
                    <span>Due: {formatDate(activity.dueAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {hasPermission("crm.update") && (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(activity)}>
                      Edit
                    </Button>
                  )}
                  {hasPermission("crm.delete") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!window.confirm("Delete this activity?")) return;
                        deleteActivity.mutate({ id: activity.id });
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              {index < activities.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            form.reset(EMPTY_ACTIVITY_FORM);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit activity" : "Add activity"}</DialogTitle>
          </DialogHeader>
          <form.AppForm>
            <form.Form>
              <div className="space-y-4">
                <FormSelectField name="type" label="Type" options={ACTIVITY_TYPE_OPTIONS} />
                <FormTextField name="title" label="Title" required />
                <FormTextareaField name="details" label="Details" />
                <FormDatePickerField name="occurredAt" label="Occurred on" />
                <FormDatePickerField name="dueAt" label="Due on" />
                <FormCheckboxField name="completed" label="Mark as completed" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <form.SubmitButton>
                  {editing ? "Save changes" : "Create activity"}
                </form.SubmitButton>
              </DialogFooter>
            </form.Form>
          </form.AppForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
