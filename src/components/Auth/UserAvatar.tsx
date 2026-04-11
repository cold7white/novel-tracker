import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './UserAvatar.css'

interface UserAvatarProps {
  onClick?: () => void
}

const UserAvatar: React.FC<UserAvatarProps> = ({ onClick }) => {
  const { user } = useAuth()

  // 生成基于邮箱的头像
  const getInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return '?'
  }

  const getDisplayName = () => {
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return '用户'
  }

  return (
    <div className="user-avatar" onClick={onClick} title={getDisplayName()}>
      {getInitial()}
    </div>
  )
}

export default UserAvatar
