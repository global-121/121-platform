import controllerAuthenticatedUser from './rules/controller-authenticated-user.mjs';
import noMethodApiTags from './rules/no-method-api-tags.mjs';
import typeormCascadeOndelete from './rules/typeorm-cascade-ondelete.mjs';

export default {
  rules: {
    'typeorm-cascade-ondelete': typeormCascadeOndelete,
    'no-method-api-tags': noMethodApiTags,
    'controller-authenticated-user': controllerAuthenticatedUser,
  },
};
