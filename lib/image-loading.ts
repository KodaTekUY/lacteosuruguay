interface ImageLoadingClassNames {
  image: string
  overlay: string
}

const IMAGE_TRANSITION = "transition-opacity duration-300"

export function getImageLoadingClassNames(isLoading: boolean): ImageLoadingClassNames {
  if (isLoading) {
    return {
      image: `${IMAGE_TRANSITION} opacity-0`,
      overlay: `${IMAGE_TRANSITION} opacity-100`,
    }
  }

  return {
    image: `${IMAGE_TRANSITION} opacity-100`,
    overlay: `${IMAGE_TRANSITION} opacity-0 pointer-events-none`,
  }
}

