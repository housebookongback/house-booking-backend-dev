module.exports = {
    async up(queryInterface, Sequelize) {
      // 1. Créer d'abord le type ENUM
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_PropertyTypes_name" AS ENUM (
            'house', 'apartment', 'villa', 'condo', 'townhouse', 'cabin', 'cottage',
            'bungalow', 'studio', 'loft', 'guesthouse', 'farmhouse', 'castle',
            'treehouse', 'yurt', 'tent', 'boat', 'other'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
  
      // 2. Créer la table avec la colonne ENUM
      await queryInterface.createTable('PropertyTypes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: 'enum_PropertyTypes_name',
          allowNull: false,
          unique: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        icon: {
          type: Sequelize.STRING,
          allowNull: true
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
  
      // 3. Insérer les données
      return queryInterface.bulkInsert('PropertyTypes', [
        {
          name: 'house',
          description: 'A standalone residential building',
          icon: 'house-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'apartment',
          description: 'A self-contained housing unit in a building',
          icon: 'apartment-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'villa',
          description: 'A large, luxurious house, often with a garden',
          icon: 'villa-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'condo',
          description: 'A privately owned unit in a multi-unit building',
          icon: 'condo-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'townhouse',
          description: 'A house that shares walls with adjacent properties',
          icon: 'townhouse-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'cabin',
          description: 'A small, simple house made of wood',
          icon: 'cabin-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'cottage',
          description: 'A small house, typically in a rural area',
          icon: 'cottage-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'bungalow',
          description: 'A low house with a broad front porch',
          icon: 'bungalow-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'studio',
          description: 'A small apartment with a combined living and sleeping area',
          icon: 'studio-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'loft',
          description: 'A large, open space converted for residential use',
          icon: 'loft-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'guesthouse',
          description: 'A separate house for guests',
          icon: 'guesthouse-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'farmhouse',
          description: 'A house on a farm',
          icon: 'farmhouse-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'castle',
          description: 'A large, fortified building',
          icon: 'castle-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'treehouse',
          description: 'A structure built in a tree',
          icon: 'treehouse-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'yurt',
          description: 'A portable, round tent',
          icon: 'yurt-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'tent',
          description: 'A portable shelter made of cloth',
          icon: 'tent-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'boat',
          description: 'A watercraft used for accommodation',
          icon: 'boat-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'other',
          description: 'Other types of accommodation',
          icon: 'other-icon',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    },
  
    async down(queryInterface, Sequelize) {
      await queryInterface.bulkDelete('PropertyTypes', null, {});
      await queryInterface.dropTable('PropertyTypes');
      return queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PropertyTypes_name";');
    }
  };