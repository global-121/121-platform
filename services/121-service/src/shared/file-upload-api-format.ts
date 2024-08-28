export const FILE_UPLOAD_API_FORMAT = {
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
};

export const IMAGE_UPLOAD_API_FORMAT = {
  schema: {
    type: 'object',
    properties: {
      image: {
        type: 'string',
        format: 'binary',
      },
    },
  },
};

export const FILE_UPLOAD_WITH_REASON_API_FORMAT = {
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
      reason: {
        type: 'string',
      },
    },
    required: ['file', 'reason'],
  },
};
