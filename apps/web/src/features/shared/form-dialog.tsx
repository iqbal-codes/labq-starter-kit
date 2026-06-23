import { FormErrors } from "@admin-template/ui/components/forms/use-form-hooks";
import React from "react";
import { Button } from "@admin-template/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@admin-template/ui/components/dialog";

export interface EntityDialogFormApi {
  AppForm: React.ComponentType<{ children?: React.ReactNode }>;
  Form: React.ComponentType<{ children?: React.ReactNode }>;
  SubmitButton: React.ComponentType<{ children?: React.ReactNode }>;
}

interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: EntityDialogFormApi;
  children: React.ReactNode;
  submitLabel?: string;
}

export function EntityFormDialog(props: EntityFormDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <props.form.AppForm>
          <props.form.Form>
            <div className="space-y-4">
              <FormErrors />
              {props.children}
            </div>
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
