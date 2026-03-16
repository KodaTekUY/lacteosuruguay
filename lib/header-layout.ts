export type MobileHeaderItem = "brand" | "cart" | "search" | "export" | "help"

export function getMobileHeaderRows(hasExportAction: boolean): MobileHeaderItem[][] {
  return [
    ["brand", "cart"],
    hasExportAction ? ["search", "export", "help"] : ["search", "help"],
  ]
}
