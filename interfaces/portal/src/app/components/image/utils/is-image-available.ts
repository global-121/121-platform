export const isImageAvailable = ({
  imageUrl,
}: {
  imageUrl: null | string | undefined;
}): boolean => {
  return (
    typeof imageUrl === 'string' &&
    imageUrl.trim().length > 0 &&
    imageUrl.trim().toLowerCase() !== 'null'
  );
};
