const express = require('express')
const Backlog = require('../models/backlog')

const router = express.Router()

// /backlogs?projectId=5c953c618b2c0b16906688b8
router.get('/backlogs', async (req, res) => {
    const { projectId } = req.query

    try {
        const result = await Backlog.findOne({ project: projectId })
        res.send(result)
    } catch (e) {
        res.status(400).send(e)
    }
})

module.exports = router