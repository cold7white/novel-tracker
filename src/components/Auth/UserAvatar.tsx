import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './UserAvatar.css'

interface UserAvatarProps {}

const UserAvatar: React.FC<UserAvatarProps> = () => {
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  const handleToggleMenu = () => {
    setShowMenu(!showMenu)
  }

  const handleSignOut = async () => {
    await signOut()
    setShowMenu(false)
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <div className="user-avatar-container" ref={menuRef}>
      <div
        className="user-avatar"
        onClick={handleToggleMenu}
        title={getDisplayName()}
      >
        {getInitial()}
      </div>
      {showMenu && (
        <div className="user-menu-compact">
          <button className="user-menu-item-compact" onClick={handleSignOut}>
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}

export default UserAvatar
