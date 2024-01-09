const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blipSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Name required'],
            unique: true,
            trim: true,
        },
        ring: {
            type: String,
            enum: ['ADOPT', 'TRIAL', 'ASSESS', 'HOLD'],
            required: [true, 'Ring required'],
            trim: true,
        },
        quadrant: {
            type: String,
            enum: ['PLATFORM & SERVICES', 'TOOLS', 'AUTOMATION', 'LANG. & FRAMEWORK'],
            required: [true, 'Quadrant required'],
            trim: true,
        },
        isNew: {
            type: Boolean,
            required: [true, 'isNew required'],
        },
        isDeleted: {
            type: Boolean,
            required: [true, 'isDeleted required'],
        },
        description: {
            type: String,
            required: [false],
            trim: true,
        },
        history: [{
            author: {
                type: String,
                required: [true, 'Author required'],
                trim: true
            },
            changes: [{
                field: {
                    type: String,
                    required: [true, 'Field required'],
                    trim: true
                },
                value: {
                    type: String,
                    required: [false],
                }
            }],
            action: {
                type: String,
                enum: ['UPDATE', 'HIDE', 'UNHIDE', 'ROLLBACK'],
                required: [true, "Action type required"],
                trim: true
            },
            updatedAt: {
                type: Date,
                required: [true]
            }
        }]
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Blip", blipSchema);
