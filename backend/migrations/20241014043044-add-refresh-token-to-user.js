module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'refreshToken', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'refreshToken');
  },
};
