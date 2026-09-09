/**
 * A single row of the ActivityInfo record query response.
 *
 * Column keys are the aliases requested in the query. 121 aliases every column
 * by the immutable field id, plus a record id column, so a renamed field code
 * or label does not change the shape of the response.
 */
export type ActivityInfoRecordDto = Record<
  string,
  string | number | boolean | null
>;
