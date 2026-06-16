import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Table, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/cn";

export function BusinessDataTable({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <Table className={cn("min-w-[1120px]", className)}>{children}</Table>;
}

export function BusinessHeadCell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <TableHead className={cn("text-white", className)}>{children}</TableHead>;
}

export function BusinessActionButtons({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  editLabel: string;
  deleteLabel: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={editLabel}
        className="size-8 border border-brand-100 bg-brand-50 text-brand-700 shadow-xs hover:border-brand-300 hover:bg-brand-100 hover:text-brand-900"
        onClick={onEdit}
      >
        <PencilSimple className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={deleteLabel}
        className="size-8 border border-danger-border bg-danger-bg text-danger-fg shadow-xs hover:border-danger-base hover:bg-danger-base hover:text-white"
        onClick={onDelete}
      >
        <Trash className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
