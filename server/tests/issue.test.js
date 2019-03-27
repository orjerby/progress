const request = require('supertest')
const app = require('../src/app')
const Sprint = require('../src/models/sprint')
const Backlog = require('../src/models/backlog')
const { sprintOneId, sprintTwoId, issueOne, issueOneId, issueTwoId, projectOneId, projectTwoId, backlogOne, backlogTwo, backlogTwoId, backlogOneId, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

describe('Issues', () => {
    describe('Create', () => {
        test('Should not create issue without properties', async () => {
            await request(app)
                .post('/issues')
                .send({})
                .expect(400)
        })

        test('Should not create issue with invalid properties', async () => {
            await request(app)
                .post('/issues')
                .send({
                    sprint: sprintOneId,
                    issue: {
                        description: "My first issue.",
                        createdAt: new Date().getTime()
                    }
                })
                .expect(400)
        })

        test('Should not create issue without sprint backlog', async () => {
            await request(app)
                .post('/issues')
                .send({
                    issue: {
                        description: "My first issue."
                    }
                })
                .expect(400)
        })

        test('Should not create issue without issue object', async () => {
            await request(app)
                .post('/issues')
                .send({
                    backlog: backlogOneId
                })
                .expect(400)
        })

        test('Should not create issue for non-exist backlog', async () => {
            await request(app)
                .post('/issues')
                .send({
                    backlog: "111111111111111111111111",
                    issue: {
                        description: "My first issue."
                    }
                })
                .expect(404)
        })

        test('Should create issue', async () => {
            const response = await request(app)
                .post('/issues')
                .send({
                    backlog: backlogOneId,
                    issue: {
                        description: "My first issue."
                    }
                })
                .expect(201)
            const backlog = await Backlog.findById(backlogOneId)
            let foundIssue = false
            backlog.issue.forEach(i => {
                if (i._id.toString() === response.body._id) {
                    expect(i.description).toEqual("My first issue.")
                    return foundIssue = true
                }
            })
            expect(foundIssue).toEqual(true)
        })
    })

    describe('Transfer', () => {
        test('Should not transfer unknown issue', async () => {
            await request(app)
                .post('/issues?transferto=sprint')
                .send({
                    sprint: sprintTwoId,
                    issue: '111111111111111111111111'
                })
                .expect(404)
        })

        test('Should not transfer to unknown sprint', async () => {
            await request(app)
                .post('/issues?transferto=sprint')
                .send({
                    sprint: '111111111111111111111111',
                    issue: issueTwoId
                })
                .expect(404)
        })

        test('Should not transfer to unknown backlog', async () => {
            await request(app)
                .post('/issues?transferto=backlog')
                .send({
                    backlog: '111111111111111111111111',
                    issue: issueTwoId
                })
                .expect(404)
        })

        test('Should not transfer without issue property', async () => {
            await request(app)
                .post('/issues?transferto=sprint')
                .send({
                    sprint: sprintTwoId
                })
                .expect(400)
        })

        test('Should not transfer with issue, backlog and sprint properties', async () => {
            await request(app)
                .post('/issues?transferto=sprint')
                .send({
                    backlog: backlogOneId,
                    sprint: sprintTwoId,
                    issue: issueTwoId
                })
                .expect(400)
        })

        test('Should not transfer to sprint without sprint property', async () => {
            await request(app)
                .post('/issues?transferto=sprint')
                .send({
                    issue: issueTwoId
                })
                .expect(400)
        })

        test('Should not transfer to backlog without backlog property', async () => {
            await request(app)
                .post('/issues?transferto=backlog')
                .send({
                    issue: issueOneId
                })
                .expect(400)
        })

        test('Should transfer to sprint', async () => {
            const sprint = await Sprint.findById(sprintOneId)
            const backlog = await Backlog.findOne({ project: projectOneId })
            await request(app)
                .post('/issues?transferto=sprint')
                .send({
                    sprint: sprintOneId,
                    issue: issueTwoId
                })
                .expect(201)
            const sprintUpdated = await Sprint.findById(sprintOneId)
            const backlogUpdated = await Backlog.findOne({ project: projectOneId })
            expect(sprintUpdated.issue.length).toEqual(sprint.issue.length + 1)
            expect(backlogUpdated.issue.length).toEqual(backlog.issue.length - 1)
        })

        test('Should transfer to backlog', async () => {
            const sprint = await Sprint.findById(sprintOneId)
            const backlog = await Backlog.findOne({ project: projectOneId })
            await request(app)
                .post('/issues?transferto=backlog')
                .send({
                    backlog: backlogOneId,
                    issue: issueOneId
                })
                .expect(201)
            const sprintUpdated = await Sprint.findById(sprintOneId)
            const backlogUpdated = await Backlog.findOne({ project: projectOneId })
            expect(backlogUpdated.issue.length).toEqual(backlog.issue.length + 1)
            expect(sprintUpdated.issue.length).toEqual(sprint.issue.length - 1)
        })
    })

    describe('Update', () => {
        test('Should not update issue without properties', async () => {
            await request(app)
                .patch(`/issues/${issueOneId}?parent=sprint`)
                .send({})
                .expect(400)
        })

        test('Should not update issue with invalid properties', async () => {
            await request(app)
                .patch(`/issues/${issueOneId}?parent=sprint`)
                .send({
                    _id: "111111111111111111111111",
                    description: "My first updated issue."
                })
                .expect(400)
            const sprint = await Sprint.findById(sprintOneId)
            let foundIssue = false
            sprint.issue.forEach(i => {
                if (i._id.toString() === issueOneId.toString()) {
                    expect(i._id).not.toEqual("111111111111111111111111")
                    return foundIssue = true
                }
            })
            expect(foundIssue).toEqual(true)
        })

        test('Should not update issue with empty description', async () => {
            await request(app)
                .patch(`/issues/${issueOneId}?parent=sprint`)
                .send({
                    description: ""
                })
                .expect(400)
            const sprint = await Sprint.findById(sprintOneId)
            let foundIssue = false
            sprint.issue.forEach(s => {
                if (s._id.toString() === issueOneId.toString()) {
                    expect(s.description).toEqual(issueOne.description)
                    return foundIssue = true
                }
            })
            expect(foundIssue).toEqual(true)
        })

        test('Should not update non-exist issue', async () => {
            await request(app)
                .patch('/issues/111111111111111111111111?parent=sprint')
                .send({
                    description: "My first updated issue."
                })
                .expect(404)
        })

        test('Should update issue', async () => {
            await request(app)
                .patch(`/issues/${issueOneId}?parent=sprint`)
                .send({
                    description: "My first updated issue."
                })
                .expect(200)
            const sprint = await Sprint.findById(sprintOneId)
            let foundIssue = false
            sprint.issue.forEach(s => {
                if (s._id.toString() === issueOneId.toString()) {
                    expect(s.description).toEqual("My first updated issue.")
                    return foundIssue = true
                }
            })
            expect(foundIssue).toEqual(true)
        })
    })

    describe('Delete', () => {
        test('Should not delete non-exist issue', async () => {
            await request(app)
                .delete('/issues/111111111111111111111111?parent=sprint')
                .send()
                .expect(404)
        })

        test('Should delete issue', async () => {
            await request(app)
                .delete(`/issues/${issueOneId}?parent=sprint`)
                .send()
                .expect(200)
            const sprint = await Sprint.findById(sprintOneId)
            let foundIssue = false
            sprint.issue.forEach(s => {
                if (s._id.toString() === issueOneId.toString()) {
                    return foundIssue = true
                }
            })
            expect(foundIssue).toEqual(false)
        })
    })
})