const blipService = require('../services/blip.service');
const mongoose = require('mongoose');

let Blip = require('../models/blip');

const IGNORED_FIELDS = ['_id', 'createdAt', 'updatedAt', '__v', 'history'];
const IS_DELETED_FIELD_NAME = 'isDeleted';
const HISTORY_SIZE_LIMIT = 10;

//create single blip
const createBlip = (req, res) => {
    const _id = mongoose.Types.ObjectId();
    const { body } = req;
    const { name, ring, quadrant, isNew, description } = body;
    const ringUppercaseCast = ring.toUpperCase();
    const isNewBooleanCast = (isNew === "TRUE");
    const quadrantUppercaseCast = quadrant.toUpperCase();
    console.log("-------------- create Blip function executed ---------------" )
    const newBlip = new Blip({
        _id,
        name,
        ring: ringUppercaseCast,
        quadrant: quadrantUppercaseCast,
        isNew: isNewBooleanCast,
        isDeleted: false,
        description
    });
    console.log("-------------- create Blip service executed ---------------" )
    blipService.createBlip(newBlip)
        .then((successMsg) => {
            return res.json(successMsg);
        })
        .catch(error => res.status(400).json(error.message));
}
//newly added | creates multiple blips
const createBlips = async (req, res) => {
    console.log("-------------- createBlips executed ---------------")
    const createBlipsResults = [];



    req.body.filter(singleBlip => {
        console.log(singleBlip)
        console.log("-------------- filter executed ---------------")
        const _id = mongoose.Types.ObjectId();
        const { name, ring, quadrant, isNew, description } = singleBlip;
        const ringUppercaseCast = ring.toUpperCase();
        const isNewBooleanCast = (isNew === "TRUE");
        const quadrantUppercaseCast = quadrant.toUpperCase();
        const newBlip = new Blip({
            _id,
            name,
            ring: ringUppercaseCast,
            quadrant: quadrantUppercaseCast,
            isNew: isNewBooleanCast,
            isDeleted: false,
            description
        });
        console.log("=======blip object=======")
        console.log(newBlip)
        console.log("---------- Blip service executed -----------")
        createBlipsResults.push(blipService.createBlip(newBlip))
        // .then((successMsg) => {
        //     console.log("-------------- execution success ---------------")
        //     createBlipsResults.push(successMsg)
        //     console.log(createBlipsResults)
        //     // res.json(createBlipsResults);
        // })
        // .catch(error => 
        //     // res.status(400).json(error.message)
        //     createBlipsResults.push(error.message)
        //     );
        

    })
    console.log("----------- Final blip results ----------------")
     
    const result = await Promise.all(
        createBlipsResults
      ).then( data =>{console.log(data); return data;} 
      ).catch(error => {console.log(error.message); return error.message });
    //   [p1,p2,p3]
    //   [r1,r2,r3]

    console.log(result);
    return res.json(result);
}

const viewAllBlips = (req, res) => {
    blipService.viewAllBlips()
        .then((blips) => {
            res.json(blips);
        })
        .catch(error => res.status(400).json(error.message));
}

const viewAllBlipsNoHistory = (req, res) => {
    blipService.viewAllBlipsNoHistory()
        .then((blips) => {
            res.json(blips);
        })
        .catch(error => res.status(400).json(error.message));
}

const viewAllDeletedBlips = (req, res) => {
    blipService.viewAllDeletedBlips()
        .then((blips) => {
            res.json(blips);
        })
        .catch(error => res.status(400).json(error.message));
}

const viewBlip = (req, res) => {
    blipService.viewBlip(req.params.blipId)
        .then((blip) => {
            res.json(blip);
        })
        .catch(error => res.status(400).json(error.message));
}

const viewBlipHistory = (req, res) => {
    blipService.viewBlipHistory(req.params.blipId)
        .then((blip) => {
            res.json(blip);
        })
        .catch(error => res.status(400).json(error.message));
}

const updateBlip = (req, res) => {

    blipService.viewBlip(req.params.blipId)
        .then((blip) => {

            const { body } = req;
            const { name, ring, quadrant, isNew, isDeleted, description } = body;
            const ringUppercaseCast = ring.toUpperCase();
            const isNewBooleanCast = (isNew === "TRUE");
            const isDeletedBooleanCast = (isDeleted === "TRUE");
            const quadrantUppercaseCast = quadrant.toUpperCase();

            var blipToUpdate = new Blip({
                name,
                ring: ringUppercaseCast,
                quadrant: quadrantUppercaseCast,
                isNew: isNewBooleanCast,
                isDeleted: isDeletedBooleanCast,
                description,
                history
            });

            var history = blip.history;
            var changes = [];

            for (var item in blip._doc) {
                if (!IGNORED_FIELDS.includes(item)) {
                    if (blipToUpdate[item] != blip[item]) {
                        var change = {
                            field: item,
                            value: blip[item],
                        }
                        changes.push(change)
                    }
                }
            }

            var historyItem = {
                author: req.params.user,
                changes: changes,
                action: 'UPDATE',
                updatedAt: new Date()
            }
            history.push(historyItem)
            limitHistory(history, HISTORY_SIZE_LIMIT)
            blipToUpdate.history = history;

            blipService.updateBlip(req.params.blipId, blipToUpdate)
                .then(successMsg => res.json(successMsg))
        })
        .catch(error => res.status(400).json(error.message));

}

// const updateBlipByName = (req, res) => {
//     const { body } = req;
//     const { name, ring, quadrant, isNew, description } = body;
//     const ringUppercaseCast = ring.toUpperCase();
//     const isNewBooleanCast = (isNew === "TRUE");
//     const isDeletedBooleanCast = (isDeleted === "TRUE");
//     const quadrantUppercaseCast = quadrant.toUpperCase();

//     const blipToUpdate = new Blip({
//         name,
//         ring: ringUppercaseCast,
//         quadrant: quadrantUppercaseCast,
//         isNew: isNewBooleanCast,
//         isDeleted: isDeletedBooleanCast,
//         description
//     });

//     blipService.updateBlipByName(blipToUpdate)
//         .then(successMsg => res.json(successMsg))
//         .catch(err => {
//             res.status(400).json(err.message)
//         })
// }

const restoreBlip = (req, res) => {
    blipService.viewBlipHistory(req.params.blipId)
        .then((blip) => {
            var history = blip.history;
            var historyItem = {
                author: req.params.user,
                changes: [{
                    field: IS_DELETED_FIELD_NAME,
                    value: 'TRUE',
                }],
                action: 'UNHIDE',
                updatedAt: new Date()
            }
            history.push(historyItem)
            limitHistory(history, HISTORY_SIZE_LIMIT)

            blipService.restoreBlip(req.params.blipId, history)
                .then(successMsg => res.json(successMsg))
                .catch(err => {
                    res.status(400).json(err.message)
                })
        })
        .catch(error => res.status(400).json(error.message));
}

const hideBlip = (req, res) => {
    blipService.viewBlipHistory(req.params.blipId)
        .then((blip) => {
            var history = blip.history;
            var historyItem = {
                author: req.params.user,
                changes: [{
                    field: IS_DELETED_FIELD_NAME,
                    value: 'FALSE',
                }],
                action: 'HIDE',
                updatedAt: new Date()
            }
            history.push(historyItem)
            limitHistory(history, HISTORY_SIZE_LIMIT)

            blipService.hideBlip(req.params.blipId, history)
                .then(successMsg => res.json(successMsg))
                .catch(err => {
                    res.status(400).json(err.message)
                })
        })
        .catch(error => res.status(400).json(error.message));
}

const rollbackBlip = (req, res) => {
    blipService.viewBlip(req.params.blipId)
        .then((blip) => {
            var history = blip.history;
            var blipToUpdate = new Blip(blip);
            var changes = [];
            history.forEach((item) => {
                if (item._id.toString() === req.params.historyItemId) {
                    item.changes.forEach((change) => {
                        blipToUpdate[change.field] = change.value;
                        console.log('new field :', blipToUpdate[change.field])
                        changes.push({
                            field: change.field,
                            value: blipToUpdate[change.field]
                        })
                    })
                }
            })

            var historyItem = {
                author: req.params.user,
                changes: changes,
                action: 'ROLLBACK',
                updatedAt: new Date()
            }
            history.push(historyItem)
            limitHistory(history, HISTORY_SIZE_LIMIT)
            blipToUpdate.history = history;

            blipService.updateBlip(req.params.blipId, blipToUpdate)
                .then(successMsg => res.json(successMsg))
        })
        .catch(error => res.status(400).json(error.message));
}

const deleteBlip = (req, res) => {
    blipService.deleteBlip(req.params.blipId)
        .then(successMsg => res.json(successMsg))
        .catch(err => res.status(400).json(err.message))
}

const deleteBlipByName = (req, res) => {
    blipService.deleteBlipByName({ name: req.params.blipName })
        .then(successMsg => res.json(successMsg))
        .catch(err => res.status(400).json(err.message))
}

//helper methods

const limitHistory = (history, limit) => {
    while (history.length > limit) {
        history.shift()
    }
    return history
}

module.exports = {
    createBlip,
    createBlips,
    viewBlip,
    viewBlipHistory,
    viewAllBlips,
    viewAllBlipsNoHistory,
    viewAllDeletedBlips,
    updateBlip,
    // updateBlipByName,
    restoreBlip,
    hideBlip,
    rollbackBlip,
    deleteBlip,
    deleteBlipByName
}
