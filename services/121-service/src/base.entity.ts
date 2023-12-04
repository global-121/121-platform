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
