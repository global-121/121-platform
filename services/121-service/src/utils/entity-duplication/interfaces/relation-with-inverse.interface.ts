import { InverseRelationWithJoinColumnsInterface } from '@121-service/src/utils/entity-duplication/interfaces/inverse-relation-with-join-columns.interface';

export interface RelationWithInverseInterface {
  isOneToMany: boolean;
  isOneToOne: boolean;
  inverseRelation?: InverseRelationWithJoinColumnsInterface;
}