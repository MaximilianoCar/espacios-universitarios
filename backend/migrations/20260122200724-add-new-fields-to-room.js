'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Rooms', 'cost', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('Rooms', 'isAccessible', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Rooms', 'canExonerate', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Rooms', 'hasBathrooms', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Rooms', 'hasInternet', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Rooms', 'hasAudioEquipment', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Rooms', 'hasVideoEquipment', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Rooms', 'acceptsTransfer', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('Rooms', 'acceptsMaterials', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Rooms', 'cost');
    await queryInterface.removeColumn('Rooms', 'isAccessible');
    await queryInterface.removeColumn('Rooms', 'canExonerate');
    await queryInterface.removeColumn('Rooms', 'hasBathrooms');
    await queryInterface.removeColumn('Rooms', 'hasInternet');
    await queryInterface.removeColumn('Rooms', 'hasAudioEquipment');
    await queryInterface.removeColumn('Rooms', 'hasVideoEquipment');
    await queryInterface.removeColumn('Rooms', 'acceptsTransfer');
    await queryInterface.removeColumn('Rooms', 'acceptsMaterials');
  },
};
