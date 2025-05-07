module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isIn: [['user', 'host', 'admin']]
            }
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        timestamps: true,
        tableName: 'roles'
    });

    Role.associate = (models) => {
        Role.belongsToMany(models.User, {
            through: models.UserRoles,
            foreignKey: 'roleId',
            otherKey: 'userId',
            as: 'users'
        });
    };

    return Role;
}; 