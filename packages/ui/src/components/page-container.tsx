import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@admin-template/ui/lib/utils";

const pageContainerVariants = cva("flex flex-1 flex-col gap-4 p-6", {
  variants: {
    width: {
      full: "",
      "7xl": "mx-auto w-full max-w-7xl",
      "6xl": "mx-auto w-full max-w-6xl",
      "5xl": "mx-auto w-full max-w-5xl",
      "4xl": "mx-auto w-full max-w-4xl",
      "3xl": "mx-auto w-full max-w-3xl",
      xl: "mx-auto w-full max-w-xl",
    },
  },
  defaultVariants: {
    width: "full",
  },
});

interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof pageContainerVariants> {}

function PageContainer({ className, width, ...props }: PageContainerProps) {
  return <div className={cn(pageContainerVariants({ width }), className)} {...props} />;
}

export { PageContainer, pageContainerVariants };
