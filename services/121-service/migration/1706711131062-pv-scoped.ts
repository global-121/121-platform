import { MigrationInterface, QueryRunner } from 'typeorm';

export class PvScoped1706711131062 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const instances = await queryRunner.query(`
      select
        id
      from
        "121-service"."instance"
      where
        name = 'NLRC';`);
    if (instances.length > 0) {
      await queryRunner.query(`
          update "121-service"."program"
          set "enableScope" = true
          where "id" = 2;
        `);

      const idCustomAttributePartnerOrganizationResult =
        await queryRunner.query(`
      select
        id
      from
        "121-service"."program_custom_attribute"
      where
        name = 'namePartnerOrganization'
        and "programId" = 2;
        `);
      const idCustomAttributePartnerOrganization =
        idCustomAttributePartnerOrganizationResult[0].id;
      console.log(
        '🚀 ~ PvScoped1706711131062 ~ up ~ idCustomAttributePartnerOrganization:',
        idCustomAttributePartnerOrganization,
      );
      const idCustomAttributeDistrictResult = await queryRunner.query(`
          select
            id
          from
            "121-service"."program_custom_attribute"
          where
            name = 'district' and "programId" = 2;
        `);
      const idCustomAttributeDistrict = idCustomAttributeDistrictResult[0].id;
      console.log(
        '🚀 ~ PvScoped1706711131062 ~ up ~ idCustomAttributeDistrict:',
        idCustomAttributeDistrict,
      );

      // Update custom attribute values of District
      // Does not update values that are already updated
      await queryRunner.query(`
        INSERT INTO "121-service"."registration_data" ("registrationId", "programCustomAttributeId", "value")
        SELECT
          rdp."registrationId",
          ${idCustomAttributeDistrict},
        CASE
            WHEN rdp.value = 'AMS_LOA' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'FLEX' THEN 'Unknown'
            WHEN rdp.value = 'UTR_Toevlucht' THEN 'Utrecht Gooi'
            WHEN rdp.value = 'AMS_ACO_GEZ' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'AMS_Stap Verder' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'ACO' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'AMS_HopeGivers' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'ROT_HopeGivers' THEN 'Rotterdam Rijnmond'
            WHEN rdp.value = 'VLAAR_HopeGivers' THEN 'Unknown'
            WHEN rdp.value = 'Aalsmeer_HopeGivers' THEN 'Unknown'
            WHEN rdp.value = 'SCHIED_HopeGivers' THEN 'Unknown'
            WHEN rdp.value = 'ZWAN_HopeGivers' THEN 'Unknown'
            WHEN rdp.value = 'CAPE a/d IJSSEL_HopeGivers' THEN 'Unknown'
            WHEN rdp.value = 'HILVER_HopeGivers' THEN 'Unknown'
            WHEN rdp.value = 'UITH_HopeGivers' THEN 'Unknown'
            WHEN rdp.value = 'ALMERE_HopeGivers' THEN 'Unknown'
            WHEN rdp.value = 'GELD_HopeGivers' THEN 'Unknown'
            WHEN rdp.value = 'AMS_TESTPARTNER' THEN 'Unknown'
            WHEN rdp.value = 'VK_Letopelkaar' THEN 'VK'
            WHEN rdp.value = 'DH_IMWU' THEN 'Unknown'
            WHEN rdp.value = 'DH_FILMIS' THEN 'Unknown'
            WHEN rdp.value = 'DU_IMWU' THEN 'Unknown'
            WHEN rdp.value = 'AMS_OiA_SP' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'AMS_OIA' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'AMS_IOM' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'AMS_COF' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'AMS_district' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'LVV_ACO' THEN 'Amsterdam-Amstelland'
            WHEN rdp.value = 'ROT_Distr' THEN 'Rotterdam Rijnmond'
            WHEN rdp.value = 'GELD_Bindkracht10' THEN 'Gelderland'
            ELSE 'Unknown'
            END
          FROM "121-service"."registration_data" rdp
          WHERE rdp."programCustomAttributeId" = ${idCustomAttributePartnerOrganization}
          AND NOT EXISTS (
            SELECT 1
            FROM "121-service"."registration_data" rd2
            WHERE rd2."registrationId" = rdp."registrationId"
            AND rd2."programCustomAttributeId" = ${idCustomAttributeDistrict}
          );
        `);

      // Update custom attribute values of Partner Organization
      await queryRunner.query(`
          update
          "121-service"."registration_data" rdp
          set
          value = case
            when rdp.value = 'AMS_LOA' then 'LOS'
            when rdp.value = 'FLEX' then 'FLEX'
            when rdp.value = 'UTR_Toevlucht' then 'Stichting Toevlucht'
            when rdp.value = 'AMS_ACO_GEZ' then 'ACO'
            when rdp.value = 'AMS_Stap Verder' then 'Stap Verder'
            when rdp.value = 'ACO' then 'ACO Amsterdam'
            when rdp.value = 'AMS_HopeGivers' then 'Hope Givers'
            when rdp.value = 'ROT_HopeGivers' then 'Hope Givers'
            when rdp.value = 'VLAAR_HopeGivers' then 'VLAAR_HopeGivers'
            when rdp.value = 'Aalsmeer_HopeGivers' then 'Aalsmeer_HopeGivers'
            when rdp.value = 'SCHIED_HopeGivers' then 'SCHIED_HopeGivers'
            when rdp.value = 'ZWAN_HopeGivers' then 'ZWAN_HopeGivers'
            when rdp.value = 'CAPE a/d IJSSEL_HopeGivers' then 'CAPE a/d IJSSEL_HopeGivers'
            when rdp.value = 'HILVER_HopeGivers' then 'HILVER_HopeGivers'
            when rdp.value = 'UITH_HopeGivers' then 'UITH_HopeGivers'
            when rdp.value = 'ALMERE_HopeGivers' then 'ALMERE_HopeGivers'
            when rdp.value = 'GELD_HopeGivers' then 'GELD_HopeGivers'
            when rdp.value = 'AMS_TESTPARTNER' then 'AMS_TESTPARTNER'
            when rdp.value = 'VK_Letopelkaar' then 'Let op Elkaar'
            when rdp.value = 'DH_IMWU' then 'DH_IMWU'
            when rdp.value = 'DH_FILMIS' then 'DH_FILMIS'
            when rdp.value = 'DU_IMWU' then 'DU_IMWU'
            when rdp.value = 'AMS_OiA_SP' then 'Opportunities in Amsterdam'
            when rdp.value = 'AMS_OIA' then 'Opportunities in Amsterdam'
            when rdp.value = 'AMS_IOM' then 'AMS_IOM'
            when rdp.value = 'AMS_COF' then 'Company of Friends'
            when rdp.value = 'AMS_district' then 'het Rode Kruis'
            when rdp.value = 'LVV_ACO' then 'ACO Amsterdam'
            when rdp.value = 'ROT_Distr' then 'het Rode Kruis'
            when rdp.value = 'GELD_Bindkracht10' then 'Bindkracht10 Nijmegen'
            else value
          end
          WHERE rdp."programCustomAttributeId" = ${idCustomAttributePartnerOrganization};
          `);

      // Update scope to <partner organization>.<district> in lower case only numeric and alphabetic characters
      await queryRunner.query(`
          update
              "121-service".registration
            set
              "scope" = subquery.new_value
            from
              (
              select
                rddi."registrationId",
                concat(REGEXP_REPLACE(LOWER(rddi.value),
                '[^a-z0-9]',
                '',
                'g'),
                '.',
                REGEXP_REPLACE(LOWER(rdpo.value),
                '[^a-z0-9]',
                '',
                'g')) as new_value
              from
                "121-service".registration_data rddi
              left join "121-service".registration_data rdpo
              on
                rddi."registrationId" = rdpo."registrationId"
              where
                rddi."programCustomAttributeId" = ${idCustomAttributeDistrict}
                and rdpo."programCustomAttributeId" = ${idCustomAttributePartnerOrganization}
            ) as subquery
            where
              "121-service".registration.id = subquery."registrationId";
          `);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
