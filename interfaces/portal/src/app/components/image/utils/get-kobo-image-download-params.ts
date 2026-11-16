interface KoboImageDownloadParams {
  programId: number | string;
  referenceId: string;
  attributeName: string;
}

export const getKoboImageDownloadParams = ({
  image,
}: {
  image: {
    programId?: number | string;
    referenceId?: string;
    attributeName?: string;
  };
}): KoboImageDownloadParams | undefined => {
  const { programId, referenceId, attributeName } = image;

  if (
    programId === undefined ||
    !referenceId?.trim() ||
    !attributeName?.trim()
  ) {
    return;
  }

  return { programId, referenceId, attributeName };
};
