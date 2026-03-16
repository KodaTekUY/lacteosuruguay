interface HorizontalScrollControlState {
  canScrollLeft: boolean
  canScrollRight: boolean
}

export function getHorizontalScrollControlState(
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
  tolerance: number = 1,
): HorizontalScrollControlState {
  if (scrollWidth - clientWidth <= tolerance) {
    return {
      canScrollLeft: false,
      canScrollRight: false,
    }
  }

  const canScrollLeft = scrollLeft > tolerance
  const canScrollRight = scrollLeft + clientWidth < scrollWidth - tolerance

  return {
    canScrollLeft,
    canScrollRight,
  }
}
