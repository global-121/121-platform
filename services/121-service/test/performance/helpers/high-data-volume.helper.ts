// eslint-disable-next-line n/no-process-env -- Required to detect high data volume mode for performance testing
export const isHighDataVolume = process.env.HIGH_DATA_VOLUME === 'true';
