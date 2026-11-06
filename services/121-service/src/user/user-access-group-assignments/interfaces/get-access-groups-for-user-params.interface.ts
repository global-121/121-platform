export interface GetAccessGroupsForUserParams {
  readonly programAssignments: readonly {
    readonly programId: number;
    readonly accessGroups: readonly {
      readonly value: string;
      readonly accessGroupLevel: {
        readonly programRegistrationAttributeId: number;
      };
    }[];
  }[];
  readonly programId: number | string;
}
