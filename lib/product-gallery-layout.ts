export function getProductGalleryWrapperClassName(): string {
  return "mx-auto w-full max-w-56 sm:max-w-64 lg:max-w-[28rem]"
}

export function getProductGalleryFrameClassName(): string {
  return "relative mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/70 p-2 shadow-sm sm:p-3"
}

export function getProductGalleryControlClassName(direction: "previous" | "next"): string {
  const sideClassName = direction === "previous" ? "left-2 sm:left-3" : "right-2 sm:right-3"

  return `top-1/2 ${sideClassName} z-10 h-8 w-8 -translate-y-1/2 border-border/70 bg-background/90 sm:h-10 sm:w-10`
}
