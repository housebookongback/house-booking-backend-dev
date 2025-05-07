module.exports = (sequelize, DataTypes) => {
    const UserRoles = sequelize.define('UserRoles', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id'
            }
        }
    }, {
        timestamps: true,
        tableName: 'user_roles',
        indexes: [
            {
                unique: true,
                fields: ['userId', 'roleId']
            }
        ]
    });

    return UserRoles;
}; 