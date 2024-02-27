const {Router} = require('express')

const {createPost, getAllPosts, getCatPosts, getPost, getUserPosts, editPost, deletePost} = require('../controllers/postControllers.js')
const authMiddleware = require('../middleware/authMiddleware.js')

const router = Router()

router.post('/', authMiddleware, createPost)
router.get('/', getAllPosts)
router.get('/:id', getPost)
router.get('/categories/:category', getCatPosts)
router.get('/users/:id', getUserPosts)
router.patch('/:id', authMiddleware, editPost)
router.delete('/:id', authMiddleware, deletePost)

module.exports = router