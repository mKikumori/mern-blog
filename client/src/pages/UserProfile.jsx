import React, { useContext, useEffect, useState } from 'react'
import {Link, useNavigate} from 'react-router-dom'
import { FaEdit } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { UserContext } from '../context/userContext';
import axios from 'axios'
import convertToBase64 from '../convert'

const UserProfile = () => {

  const [avatar, setAvatar] = useState({avatar: ''})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [isAvatarTouched, setIsAvatarTouched] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const {currentUser} = useContext(UserContext)
  const token = currentUser?.token

  // redirect to login page to user's not logged in
  useEffect(() => {
    if(!token) {
      navigate('/login')
    }
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/users/${currentUser.id}`, 
      {withCredentials: true, headers: {Authorization: `Bearer ${token}`}})
      const {name, email, avatar} =response.data
      setName(name)
      setEmail(email)
      setAvatar(avatar)
      console.log(`TEST 3: ${avatar}`)
    }

    getUser()
  }, [])

  const changeAvatarHandler = async () => {
    setIsAvatarTouched(false)
    try {

      const postData = new FormData()
      postData.set('avatar', avatar)
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/users/change-avatar`, postData, 
      {withCredentials: true, headers: {Authorization: `Bearer ${token}`}})
      setAvatar(response?.data.avatar)
      console.log(`TEST 2: ${avatar}`)
      
    } catch (err) {
      setError(err.response.data.message)
    }
  }

  const updateUserDetails = async (e) => {
    e.preventDefault()

    try {
      const userData = new FormData()
      userData.set('name', name)
      userData.set('email', email)
      userData.set('currentPassword', currentPassword)
      userData.set('newPassword', newPassword)
      userData.set('confirmNewPassword', confirmNewPassword)
  
      const response = await axios.patch(`${process.env.REACT_APP_BASE_URL}/users/edit-user`, userData, 
      {withCredentials: true, headers: {Authorization: `Bearer ${token}`}})
      if(response.status == 200) {
        navigate('/logout')
      }
    } catch (err) {
      setError(err.response.data.message)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    const base64 = await convertToBase64(file)
    setAvatar({ ...avatar, myFile : base64 })
    console.log(`TEST 1: ${avatar}`)
  }

  return (
    <section className="profile">
      <div className="container profile__container">
        <Link to={`/myposts/${currentUser.id}`} className='btn'>My Posts</Link>

        <div className="profile__details">
          <div className="avatar__wrapper">
            <div className="profile__avatar">
              <img src={`${process.env.REACT_APP_ASSETS_URL}/uploads/${avatar}`} alt="Avatar picture" />
            </div>
            {/* User select profile picture form */}
            <form className="avatar__form">
              <input type="file" name='avatar' id='avatar' accept='png, jpg, jpeg' onChange={(e) => handleFileUpload(e)}/>
              <label htmlFor="avatar" onClick={() => setIsAvatarTouched(true)}><FaEdit/></label>
              
            </form>
            {isAvatarTouched && <button className="profile__avatar-btn" onClick={changeAvatarHandler}><FaCheck/></button>}
          </div>
          
          <h1>{currentUser.name}</h1>

          {/* form ro update User details */}
          <form className="form profile__form" onSubmit={updateUserDetails}>
            {error && <p className='form__error-message'>{error}</p>}
            <input type="text" placeholder='Full Name' value={name} onChange={e => setName(e.target.value)}/>
            <input type="text" placeholder='Email' value={email} onChange={e => setEmail(e.target.value)}/>
            <input type="password" placeholder='Curent Password' value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}/>
            <input type="password" placeholder='New Password' value={newPassword} onChange={e => setNewPassword(e.target.value)}/>
            <input type="password" placeholder='Confirm New Password' value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}/>
            <button type="submit" className='btn primary'>Update details</button>
          </form>

        </div>
      </div>
    </section>
  )
}

export default UserProfile