import { useState, useEffect } from 'react'

const STORAGE_KEY = 'bead_studio_auth'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从 localStorage 恢复登录状态
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 简单验证演示
        if (!email || !email.includes('@')) {
          reject(new Error('请输入有效的邮箱地址'))
          return
        }
        if (password.length < 6) {
          reject(new Error('密码至少需要6个字符'))
          return
        }

        const userData = {
          id: Date.now(),
          email,
          name: email.split('@')[0],
          createdAt: new Date().toISOString()
        }
        setUser(userData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
        resolve(userData)
      }, 500)
    })
  }

  const register = (email, password, confirmPassword) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !email.includes('@')) {
          reject(new Error('请输入有效的邮箱地址'))
          return
        }
        if (password.length < 6) {
          reject(new Error('密码至少需要6个字符'))
          return
        }
        if (password !== confirmPassword) {
          reject(new Error('两次输入的密码不一致'))
          return
        }

        const userData = {
          id: Date.now(),
          email,
          name: email.split('@')[0],
          createdAt: new Date().toISOString()
        }
        setUser(userData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
        resolve(userData)
      }, 500)
    })
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { user, loading, login, register, logout }
}
