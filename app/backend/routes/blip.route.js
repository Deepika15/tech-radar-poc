const router = require('express').Router();
const blipController = require('../controllers/blip.controller');

router.post('/createBlip', (req, res) => {
    blipController.createBlip(req, res);
});

router.post('/createBlips', (req, res) => {
    blipController.createBlips(req, res);
});

router.get('/viewBlip/:blipId', (req, res) => {
    blipController.viewBlip(req, res);
});

router.get('/viewBlipHistory/:blipId', (req, res) => {
    blipController.viewBlipHistory(req, res);
});

//returns all blips with isDeleted set to false
router.get('/viewAllBlips', (req, res) => {
    blipController.viewAllBlips(req, res);
});

//returns all blips with isDeleted set to false without history timeline
router.get('/viewAllBlipsNoHistory', (req, res) => {
    blipController.viewAllBlipsNoHistory(req, res);
});

//returns all blips with isDeleted set to true
router.get('/viewAllDeletedBlips', (req, res) => {
    blipController.viewAllDeletedBlips(req, res);
});

router.post('/updateBlip/:blipId/:user', (req, res) => {
    blipController.updateBlip(req, res);
});

// router.post('/updateBlipByName/:user', (req, res) => {
//     blipController.updateBlipByName(req, res);
// });

router.post('/restoreBlip/:blipId/:user', (req, res) => {
    blipController.restoreBlip(req, res);
});

router.post('/hideBlip/:blipId/:user', (req, res) => {
    blipController.hideBlip(req, res);
});

router.post('/rollbackBlip/:blipId/:historyItemId/:user', (req, res) => {
    blipController.rollbackBlip(req, res);
})

router.delete('do', (req, res) => {
    blipController.deleteBlip(req, res);
});

router.delete('/deleteBlipByName/:blipName/', (req, res) => {
    blipController.deleteBlipByName(req, res);
});

module.exports = router;