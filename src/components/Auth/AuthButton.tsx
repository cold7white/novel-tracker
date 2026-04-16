import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './AuthButton.css'

const AuthButton: React.FC = () => {
  const { user, signOut } = useAuth()

  if (user) {
    return (
      <div className="auth-button-group">
        <span className="user-email">{user.email}</span>
        <button className="btn btn-secondary" onClick={() => signOut()}>
          退出登录
        </button>
      </div>
    )
  }

  return null
}

export default AuthButton
