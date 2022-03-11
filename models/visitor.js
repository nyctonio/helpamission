const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        contact: {
            type: String,
        },
        donations: [
            {
                type: String,
            },
        ],
        bloodGroup: {
            type: String,
            required: true,
        },
        email: {
            type: String,
        },
        address: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const visitor = mongoose.model("visitor", visitorSchema);

module.exports = visitor;
