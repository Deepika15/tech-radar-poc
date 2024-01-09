const blipDb = require('../db/blip.db');
const blip = require('../models/blip');

const createBlip = async (newBlip) => {
    return blipDb.createBlip(newBlip)
        .then(() => 'Blip ' + newBlip._id + ' created successfully')
        .catch(err => { throw new Error('Create Blip Error: ' + err) });
}


const viewBlip = async (blipId) => {
    return blipDb.viewBlip(blipId)
        .then((blip) => blip)
        .catch(err => { throw new Error('View Blip ' + blipId + ':' + err) });
}

const viewBlipHistory = async (blipId) => {
    return blipDb.viewBlipHistory(blipId)
    .then((blip) => blip)
    .catch(err => { throw new Error('Blip History Retrieval' + blipId + ':' + err) });
}

const viewAllBlips = async () => {
    return blipDb.viewAllBlips()
        .then((blips) => blips)
        .catch(err => { throw new Error('View All Blips Error: ' + err) });
}

const viewAllBlipsNoHistory = async () => {
    return blipDb.viewAllBlipsNoHistory()
        .then((blips) => blips)
        .catch(err => { throw new Error('View All Blips Error: ' + err) });
}


const viewAllDeletedBlips = async () => {
    return blipDb.viewAllDeletedBlips()
        .then((blips) => blips)
        .catch(err => { throw new Error('View All Deleted Blips Error: ' + err) });
}

const updateBlip = async (blipId, blipToUpdate) => {
    return blipDb.updateBlip(blipId, blipToUpdate)
        .then(() => 'Blip updated successfully')
        .catch(err => { throw new Error('Update Blip ' + blipId + ':' + err) });
}

// const updateBlipByName = async (blipToUpdate) => {
//     return blipDb.updateBlip(blipToUpdate)
//         .then(() => 'Blip updated successfully')
//         .catch(err => { throw new Error('Update Blip ' + blipToUpdate.name + ':' + err) });
// }

const restoreBlip = async (blipId, history) => {
    return blipDb.restoreBlip(blipId, history)
    .then(() => 'Blip restored successfully')
    .catch(err => {throw new Error('Restore Blip ' + blipId + ":" + err)});
}

const hideBlip = async (blipId, history) => {
    return blipDb.hideBlip(blipId, history)
    .then(() => 'Blip hidden successfully')
    .catch(err => {throw new Error('Hide Blip ' + blipId + ":" + err)});
}

const deleteBlip = async (blipId) => {
    return blipDb.deleteBlip(blipId)
        .then(() => 'Blip deleted successfully')
        .catch(err => { throw new Error('Delete Blip ' + blipId + ':' + err) });
}

const deleteBlipByName = async (name) => {
    return blipDb.deleteBlipByName(name)
        .then(() => 'Blip deleted successfully')
        .catch(err => { throw new Error('Delete Blip ' + name + ':' + err) });
}

module.exports = {
    createBlip,
    viewAllBlips,
    viewAllBlipsNoHistory,
    viewAllDeletedBlips,
    viewBlip,
    updateBlip,
    // updateBlipByName,
    restoreBlip,
    hideBlip,
    deleteBlip,
    deleteBlipByName,
    viewBlipHistory
}