import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppDataSource } from '../appdatasource';

export class Base121Entity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index()
  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public updated: Date;
}

export class CascadeDeleteEntity extends Base121Entity {
  // IMPORTANT: This function only works if you use .remove and not .delete
  public async deleteAllOneToMany(
    deleteList: CascadeDeleteInput[],
  ): Promise<void> {
    for (const i of deleteList) {
      await this.deleteOneToMany(i.entityClass, i.columnName);
    }
  }

  public async deleteOneToMany(entity: any, columnName: string): Promise<void> {
    const repo = AppDataSource.getRepository(entity);
    const deleteItems = await repo
      .createQueryBuilder('todelete')
      .where(`todelete.${columnName} = :removeId`, { removeId: this.id })
      .getMany();
    await repo.remove(deleteItems);
  }
}

class CascadeDeleteInput {
  public columnName: string;
  public entityClass: any;
}

export class ScopedBase121Entity extends CascadeDeleteEntity {
  // TODO: add some database constraints to make sure that scope is always lowercase
  // TODO: DO not make this nullable but set everything to empty string in migration
  // Also not use the setting {default: ''} because than we will forget to set it later just one time '' in the migration
  // Add index
  @Column({ nullable: true })
  public scope: string;
}
