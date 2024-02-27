const HttpError = require('../models/errorModel.js')
const User = require('../models/userModel.js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const {v4: uuid} = require('uuid')

// POST to register new user
// api/users/register
const registerUser = async (req, res, next) => {
    try {
        
        const {name, email, password, password2} = req.body
        const newEmail = email.toLowerCase()

        if(!name || !email || !password) {
            return next(new HttpError("Fill in all fields", 422))
        }

        const emailExists = await User.findOne({email: newEmail})
        if(emailExists) {
            return next(new HttpError("Email already exists", 422))
        }

        if((password.trim()).length < 6) {
            return next(new HttpError("Password should be more then 6 characters", 422))
        }

        if(password != password2) {
            return next(new HttpError("Passwords do not match", 422))
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = await User.create({name, email: newEmail, password: hashedPassword})

        res.status(201).json(`New User ${newUser.email} registered!`)

    } catch (error) {
        return next(new HttpError("User registration failed", 422))
    }
}


// POST to login registered user
// api/users/login
const loginUser = async (req, res, next) => {
    try {
        
        const {email, password} = req.body
        if(!email || !password) {
            return next(new HttpError("Fill in all fields", 422))
        }

        const newEmail = email.toLowerCase()
        const user = await User.findOne({email: newEmail})

        if(!user) {
            return next(new HttpError("Invalid credantions", 422))
        }

        const comparePassword = await bcrypt.compare(password, user.password)
        if(!comparePassword) {
            return next(new HttpError("Invalid credantions", 422))
        }

        const {_id: id, name} = user
        const token = jwt.sign({id, name}, process.env.JWT_SECRET, {expiresIn: "1d"})

        res.status(200).json({token, id, name})

    } catch (error) {
        return next(new HttpError("Login failed", 422))
    }
}


// GET to get user profile
// api/users/:id
const getUser = async (req, res, next) => {
    try {
        
        const {id} = req.params
        const user = await User.findById(id).select('-password')
        if(!user) {
            return next(new HttpError("User not found"))
        }

        res.status(200).json(user)

    } catch (error) {
        return next(new HttpError(error))
    }
}


// POST to change user avatar
// api/users/change-avatar
const changeAvatar = async (req, res, next) => {
    try {
        
        if(!req.files.avatar) {
            return next(new HttpError("Please choose an image", 422))
        }

        // find user from database
        const user = await User.findById(req.user.id)

        // delete old avatar if exists
        if(user.avatar) {
            fs.unlink(path.join(__dirname, '..', 'uploads', user.avatar), (err) => {
                if(err) {
                    return next(new HttpError(err))
                }
            })
        }

        const {avatar} = req.files

        // check file size
        if(avatar.size > 500000) {
            return next(new HttpError("Profile picture too big"))
        }

        let fileName
        fileName = avatar.name
        let splittedFileName = fileName.split('.')
        let newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length - 1]
        avatar.mv(path.join(__dirname, '..', 'uploads', newFileName), async (err) => {
            if(err) {
                return next(new HttpError(err))
            }

            const updatedAvatar = await User.findByIdAndUpdate(req.user.id, {avatar: newFileName}, {new: true})

            if(!updatedAvatar) {
                return next(new HttpError("Avatar couldn't be changed", 422))
            }

            res.status(200).json(updatedAvatar)
        })

    } catch (error) {
        return next(new HttpError(error))
    }
}


// PATCH to edit user details
// api/users/edit-user
const editUser = async (req, res, next) => {
    try {
        
        const {name, email, currentPassword, newPassword, confirmNewPassword} = req.body
        if(!name || !email || !currentPassword || !newPassword) {
            return next(new HttpError("Fill in all the fields", 422))
        }

        // get user from database
        const user = await User.findById(req.user.id)
        if(!user) {
            return next(new HttpError("User not found", 403))
        }


        // new email must not exist already
        const emailExists = await User.findOne({email})
        if(emailExists && (emailExists._id != req.user.id)) {
            return next(new HttpError("Email already exists", 422))
        }

        // compare current password with the one stored at the BD
        const validateUserPassword = await bcrypt.compare(currentPassword, user.password)
        if(!validateUserPassword) {
            return next(new HttpError("Invalid current password", 422))
        }

        // compare new passwords
        if(newPassword !== confirmNewPassword) {
            return next(new HttpError("New passwords do not match", 422))
        }

        // hash new password
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(newPassword, salt)

        // update user info in the DB
        const newInfo = await User.findByIdAndUpdate(req.user.id, {name, email, password: hash}, {new: true})
        res.status(200).json(newInfo)

    } catch (error) {
        return next(new HttpError(error))
    }
}


// GET to get all users
// api/users
const getAllUsers = async (req, res, next) => {
    try {
        
        const allUsers = await User.find().select('-password')

        res.json(allUsers)

    } catch (error) {
        return next(new HttpError(error))
    }
}


module.exports = {registerUser, loginUser, getUser, changeAvatar, editUser, getAllUsers}