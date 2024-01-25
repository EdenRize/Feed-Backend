import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'
import mongodb from 'mongodb'
const { ObjectId } = mongodb

const PAGE_SIZE = 3


async function query(filterBy = { txt: '' }) {
    try {
        const criteria = {
            txt: { $regex: filterBy.txt, $options: 'i' }
        };
        const collection = await dbService.getCollection('comment')
        var commentCursor = await collection.find(criteria)

        if (filterBy.pageIdx !== undefined) {
            commentCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
        }

        const comments = await commentCursor.toArray()

        comments.forEach(comment => {
            comment.createdAt = comment._id.getTimestamp().valueOf()
        })

        return comments
    } catch (err) {
        logger.error('cannot find comments', err)
        throw err
    }
}

async function getById(commentId) {
    try {
        const collection = await dbService.getCollection('comment')
        const comment = await collection.findOne({ _id: ObjectId(commentId) })
        comment.createdAt = comment._id.getTimestamp().valueOf()
        return comment
    } catch (err) {
        logger.error(`while finding comment ${commentId}`, err)
        throw err
    }
}

async function remove(commentId) {
    try {
        const collection = await dbService.getCollection('comment')
        await collection.deleteOne({ _id: ObjectId(commentId) })
        return commentId
    } catch (err) {
        logger.error(`cannot remove comment ${commentId}`, err)
        throw err
    }
}

async function add(comment) {
    try {
        const collection = await dbService.getCollection('comment')
        await collection.insertOne(comment)
        return comment
    } catch (err) {
        logger.error('cannot insert comment', err)
        throw err
    }
}

async function update(comment) {
    try {
        const commentToSave = {
            txt: comment.txt
        }
        const collection = await dbService.getCollection('comment')
        await collection.updateOne({ _id: ObjectId(comment._id) }, { $set: commentToSave })
        return comment
    } catch (err) {
        logger.error(`cannot update comment ${comment._id}`, err)
        throw err
    }
}

async function addCommentMsg(commentId, msg) {
    try {
        msg.id = utilService.makeId()
        const collection = await dbService.getCollection('comment')
        await collection.updateOne({ _id: ObjectId(commentId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        logger.error(`cannot add comment msg ${commentId}`, err)
        throw err
    }
}

async function removeCommentMsg(commentId, msgId) {
    try {
        const collection = await dbService.getCollection('comment')
        await collection.updateOne({ _id: ObjectId(commentId) }, { $pull: { msgs: { id: msgId } } })
        return msgId
    } catch (err) {
        logger.error(`cannot add comment msg ${commentId}`, err)
        throw err
    }
}

export const commentService = {
    remove,
    query,
    getById,
    add,
    update,
    addCommentMsg,
    removeCommentMsg
}
