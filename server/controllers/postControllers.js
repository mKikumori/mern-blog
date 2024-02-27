const Post = require('../models/postModel.js')
const User = require('../models/userModel.js')
const path = require('path')
const fs = require('fs')
const {v4: uuid} = require('uuid')
const HttpError = require('../models/errorModel.js')

// POST to Create a post
// api/posts
const createPost = async (req, res, next) => {
    try {
        
        let {title, category, description} = req.body
        if(!title || !category || !description || !req.files) {
            return next(new HttpError("Fill in all fields and choose thumbnail", 422))
        }

        const {thumbnail} = req.files

        // check thumbnail size
        if(thumbnail.size > 2000000) {
            return next(new HttpError("Thumbnail too big. Fiile should be less than 2Mb"))
        }
        let fileName = thumbnail.name
        let splittedFileName = fileName.split('.')
        let newFileName = splittedFileName[0] + uuid() + "." + splittedFileName[splittedFileName.length - 1]
        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFileName), async (err) => {
            if(err) {
                return next(new HttpError(err))
            } else {
                const newPost = await Post.create({title, category, description, thumbnail: newFileName, creator: req.user.id})
                if(!newPost) {
                    return next(new HttpError("Post couldn't be created", 422))
                }

                // find user and increment post count by 1
                const currentUser = await User.findById(req.user.id)
                const userPostCount = currentUser.posts + 1
                await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})

                res.status(201).json(newPost)
            }
        })

    } catch (error) {
        return next(new HttpError(error))
    }
}


// GET to get all post
// api/posts
const getAllPosts = async (req, res, next) => {
    try {
        const posts = await Post.find().sort({updatedAt: -1})

        if(!posts) {
            return next(new HttpError("Posts not found", 422))
        }

        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}


// GET to get a post
// api/posts/:id
const getPost = async (req, res, next) => {
    try {
        
        const postId = req.params.id
        const post = await Post.findById(postId)

        if(!post) {
            return next(new HttpError("Post not found", 422))
        }
        res.status(200).json(post)

    } catch (error) {
        return next(new HttpError(error))
    }
}


// GET to get a post by category
// api/posts/categories/:category
const getCatPosts = async (req, res, next) => {
    try {
        
        const {category} = req.params
        const catPosts = await Post.find({category}).sort({updatedAt: -1})

        if(!catPosts) {
            return next(new HttpError("Category doesn't exists", 422))
        }

        res.status(200).json(catPosts)

    } catch (error) {
        return next(new HttpError(error))
    }
}


// GET to get user's posts
// api/posts/users/:id
const getUserPosts = async (req, res, next) => {
    try {
        
        const {id} = req.params
        const posts = await Post.find({creator: id}).sort({updatedAt: -1})

        if(!posts) {
            return next(new HttpError("User doesn't exists"))
        }
        res.status(200).json(posts)

    } catch (error) {
        return next(new HttpError(error))
    }
}


// PATCH to edit a post
// api/posts/:id
const editPost = async (req, res, next) => {
    try {
        
        let fileName
        let newFileName
        let updatedPost
        const postId = req.params.id
        let {title, category, description} = req.body

        if(!title || !category || description.length < 12) {
            return next(new HttpError("Fill in all fields", 422))
        }
            // get old post from the DB
            const oldPost = await Post.findById(postId)
        if(req.user.id == oldPost.creator) {

        if(!req.files) {
            updatedPost = await Post.findByIdAndUpdate(postId, {title, category, description}, {new: true})
        } else {
            

            // delete old thumbnail from ./upload
            fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), async (err) => {
                if(err) {
                    return next(new HttpError(err))
                }
            })
            // upload new thumbnail
            const {thumbnail} = req.files

            // check file size
            if(thumbnail.size > 2000000) {
                return next(new HttpError("Thumbnail too big. Should be less than 2Mb"))
            }
            
            fileName = thumbnail.name
            let splittedFileName = fileName.split('.')
            newFileName = splittedFileName[0] + uuid() + "."+ splittedFileName[splittedFileName.length - 1]
            thumbnail.mv(path.join(__dirname, '..', 'uploads', newFileName), async (err) => {
                if(err) {
                    return next(new HttpError(err))
                }
            })

            updatedPost = await Post.findByIdAndUpdate(postId, {title, category, description, thumbnail: newFileName}, {new: true})

        }
        
    }

    if(!updatedPost) {
        return next(new HttpError("Couldn't update post", 422))
    }

    res.status(200).json(updatedPost)

    } catch (error) {
        return next(new HttpError(error))
    }
}


// DELETE to delete a post
// api/posts/:id
const deletePost = async (req, res, next) => {
    try {
        
        const postId = req.params.id
        if(!postId) {
            return next(new HttpError("Post unavailable", 400))
        }

        const post = await Post.findById(postId)
        const fileName = post?.thumbnail

        // check if the user logged in is the same as the one that posted the post
        if(req.user.id == post.creator) {

        // delete thumbnail from uploads folder
        fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async (err) => {
            if(err) {
                return next(new HttpError(err))
            } else {

                await Post.findByIdAndDelete(postId)

                // find user and reduce post count by 1
                const currentUser = await User.findById(req.user.id)
                const userPostCount = currentUser?.posts - 1
                await User.findByIdAndUpdate(req.user.id, {posts: userPostCount})
                res.json(`Post ${postId} deleted successfuly`)

            }
        })
    } else {
        return next(new HttpError("Post couldn't be deleted", 403))
    }   
    } catch (error) {
        return next(new HttpError(error))
    }
}


module.exports = {createPost, getAllPosts, getCatPosts, getPost, getUserPosts, editPost, deletePost}