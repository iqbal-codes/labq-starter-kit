import { useState } from "react";
import { Button } from "@labq-modules/ui/components/button";
import { SparklesIcon } from "lucide-react";
import { AssistantSheet } from "./assistant-sheet";

export function AssistantButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 size-12 rounded-full bg-foreground text-background shadow-xl hover:scale-105 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-ring"
          size="icon"
        >
          <SparklesIcon className="size-5" />
          <span className="sr-only">Open Assistant</span>
        </Button>
      )}
      <AssistantSheet open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
