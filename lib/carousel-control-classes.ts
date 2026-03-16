type CarouselControlDirection = "previous" | "next"
type CarouselControlOrientation = "horizontal" | "vertical"

interface CarouselControlPositionClassNameOptions {
  className?: string
  direction: CarouselControlDirection
  orientation: CarouselControlOrientation
}

const horizontalOverridePatterns = {
  previous: /(?:^|\s)!?left-[^\s]+|(?:^|\s)left-auto(?:\s|$)/,
  next: /(?:^|\s)!?right-[^\s]+|(?:^|\s)right-auto(?:\s|$)/,
} as const

const verticalOverridePatterns = {
  previous: /(?:^|\s)!?top-[^\s]+|(?:^|\s)top-auto(?:\s|$)/,
  next: /(?:^|\s)!?bottom-[^\s]+|(?:^|\s)bottom-auto(?:\s|$)/,
} as const

export function getCarouselControlPositionClasses({
  className = "",
  direction,
  orientation,
}: CarouselControlPositionClassNameOptions): string {
  if (orientation === "horizontal") {
    const hasOverride = horizontalOverridePatterns[direction].test(className)
    if (direction === "previous") {
      return hasOverride ? "top-1/2 -translate-y-1/2" : "top-1/2 -left-12 -translate-y-1/2"
    }

    return hasOverride ? "top-1/2 -translate-y-1/2" : "top-1/2 -right-12 -translate-y-1/2"
  }

  const hasOverride = verticalOverridePatterns[direction].test(className)
  if (direction === "previous") {
    return hasOverride ? "left-1/2 -translate-x-1/2 rotate-90" : "-top-12 left-1/2 -translate-x-1/2 rotate-90"
  }

  return hasOverride ? "left-1/2 -translate-x-1/2 rotate-90" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90"
}
