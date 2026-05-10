import { useState, useEffect } from 'react'
import { loadString, saveString } from '../utils/storage'
import { KEYS } from '../constants/theme'

/** Manages user profile (name, email) with auto-persistence. */
export function useProfile() {
  const [userName,  setUserNameRaw]  = useState('Friend')
  const [userEmail, setUserEmailRaw] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      const name  = await loadString(KEYS.name)
      const email = await loadString(KEYS.email)
      if (name)  setUserNameRaw(name)
      if (email) setUserEmailRaw(email)
      setProfileLoaded(true)
    })()
  }, [])

  const setUserName = (v) => { setUserNameRaw(v); saveString(KEYS.name, v) }
  const setUserEmail = (v) => { setUserEmailRaw(v); saveString(KEYS.email, v) }

  return { userName, setUserName, userEmail, setUserEmail, profileLoaded }
}
