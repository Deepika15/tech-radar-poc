let Blip = require('../models/blip');

const createBlip = async (newBlip) => {
    return newBlip.save().catch(e => { throw e });
}

const viewAllBlips = async () => {
    return Blip.find({ 'isDeleted': false })
        .catch(e => { throw e });
}

const viewAllBlipsNoHistory = async () => {
    return Blip.find({ 'isDeleted': false })
        .select('-history')
        .catch(e => { throw e });
}

const viewAllDeletedBlips = async () => {
    return Blip.find({ 'isDeleted': true })
        .catch(e => { throw e });
}

const viewBlip = async (blipId) => {
    return Blip.findById(blipId)
        .catch(e => { throw e });
}

const viewBlipHistory = async (blipId) => {
    return Blip.findById(blipId)
    .select('history')
    .catch(e => { throw e });
}

const updateBlip = async (blipId, blipToUpdate) => {
    return Blip.findByIdAndUpdate(blipId, {
        name: blipToUpdate.name,
        ring: blipToUpdate.ring,
        quadrant: blipToUpdate.quadrant,
        isNew: blipToUpdate.isNew,
        isDeleted: blipToUpdate.isDeleted,
        description: blipToUpdate.description,
        history: blipToUpdate.history
    },
        { useFindAndModify: false })
        .catch(e => { throw e });
}

// const updateBlipByName = async (blipId, blipToUpdate) => {
//     const filter = { name: blipToUpdate.name };
//     const update = {
//         ring: blipToUpdate.ring,
//         quadrant: blipToUpdate.quadrant,
//         isNew: blipToUpdate.isNew,
//         description: blipToUpdate.description
//     }
//     return Blip.findOneAndUpdate(filter, update,
//         { useFindAndModify: false })
//         .catch(e => { throw e });
// }

const restoreBlip = async (blipId, history) => {
    return Blip.findByIdAndUpdate(blipId, 
        { 
            isDeleted: false,
            history: history
        }, 
        { useFindAndModify: false })
        .catch(e => { throw e });
}

const hideBlip = async (blipId, history) => {
    return Blip.findByIdAndUpdate(blipId, 
        { 
            isDeleted: true,
            history: history
        },  
        { useFindAndModify: false })
        .catch(e => { throw e });
}

const deleteBlip = async (blipId) => {
    return Blip.findByIdAndDelete(blipId).catch(e => { throw e });
}

const deleteBlipByName = async (name) => {
    return Blip.findOneAndDelete(name).catch(e => { throw e });
}


module.exports = {
    createBlip,
    viewAllBlips,
    viewAllBlipsNoHistory,
    viewAllDeletedBlips,
    viewBlip,
    viewBlipHistory,
    updateBlip,
    // updateBlipByName,
    restoreBlip,
    hideBlip,
    deleteBlip,
    deleteBlipByName
}