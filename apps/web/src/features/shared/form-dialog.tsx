import React from "react";
import { Button } from "@labq-modules/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@labq-modules/ui/components/dialog";

export interface CrmDialogFormApi {
  AppForm: React.ComponentType<{ children?: React.ReactNode }>;
  Form: React.ComponentType<{ children?: React.ReactNode }>;
  SubmitButton: React.ComponentType<{ children?: React.ReactNode }>;
}

interface CrmFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: CrmDialogFormApi;
  children: React.ReactNode;
  submitLabel?: string;
}

export function CrmFormDialog(props: CrmFormDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <props.form.AppForm>
          <props.form.Form>
            <div className="space-y-4">{props.children}</div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
                Cancel
              </Button>
              <props.form.SubmitButton>{props.submitLabel ?? "Save"}</props.form.SubmitButton>
            </DialogFooter>
          </props.form.Form>
        </props.form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
