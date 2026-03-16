import { cn } from "@/lib/utils"

const ADMIN_DIALOG_CONTENT_CLASS_NAME = "max-h-[80vh] max-w-6xl overflow-y-auto"

export function getAdminDialogContentClassName(className?: string): string {
  return cn(ADMIN_DIALOG_CONTENT_CLASS_NAME, className)
}
