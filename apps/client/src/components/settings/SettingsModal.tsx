import React, { useState } from 'react'
import { API_BASE_URL } from '../../lib/apiClient'

interface SettingsModalProps {
  user: any
  bookDetails: any
  joinedBooks: any[] // list of user's books to choose default
  onClose: () => void
  onUserUpdate: (updatedUser: any) => void
  onBookRename: (newName: string) => void
  onReplayTour: () => void
  onLogout: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  bookDetails,
  joinedBooks,
  onClose,
  onUserUpdate,
  onBookRename,
  onReplayTour,
  onLogout
}) => {
  // Tabs: 'profile' | 'book' | 'interface' | 'notifications' | 'security'
  const [activeTab, setActiveTab] = useState<'profile' | 'book' | 'interface' | 'notifications' | 'security'>('profile')

  // Profile Form States
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Book Preferences Form States
  const [defaultBookId, setDefaultBookId] = useState(user.defaultBookId || '')
  const [bookName, setBookName] = useState(bookDetails?.name || '')
  const [bookSuccess, setBookSuccess] = useState(false)
  const [bookError, setBookError] = useState<string | null>(null)
  const [bookLoading, setBookLoading] = useState(false)

  // Notification Preferences States
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('bookchat_notify_sound')
    return saved !== 'false' // default to true
  })
  const [toastsEnabled, setToastsEnabled] = useState(() => {
    const saved = localStorage.getItem('bookchat_notify_toasts')
    return saved !== 'false' // default to true
  })
  const [notifySuccess, setNotifySuccess] = useState(false)

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [securitySuccess, setSecuritySuccess] = useState(false)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securityLoading, setSecurityLoading] = useState(false)

  const isCreator = bookDetails?.creatorId === user.id

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)
    setProfileLoading(true)

    const trimmed = displayName.trim()
    if (!trimmed) {
      setProfileError('Pen name cannot be empty.')
      setProfileLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: trimmed }),
        credentials: 'include'
      })

      const data = await res.json()
      if (!res.ok) {
        setProfileError(data.error || 'Failed to update pen name.')
      } else {
        onUserUpdate(data)
        setProfileSuccess(true)
      }
    } catch (err) {
      console.error(err)
      setProfileError('Failed to save settings to the server.')
    } finally {
      setProfileLoading(false)
    }
  }

  // Save default book selection and book renaming
  const handleSaveBookPrefs = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookError(null)
    setBookSuccess(false)
    setBookLoading(true)

    try {
      // 1. Update user default Book Selection
      const userRes = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultBookId: defaultBookId || null }),
        credentials: 'include'
      })

      if (!userRes.ok) {
        const userData = await userRes.json()
        setBookError(userData.error || 'Failed to update default book selection.')
        setBookLoading(false)
        return
      }

      const updatedUser = await userRes.json()
      onUserUpdate(updatedUser)

      // 2. Rename Book (if creator and modified)
      if (isCreator && bookDetails && bookName.trim() !== bookDetails.name) {
        const trimmedBookName = bookName.trim()
        if (!trimmedBookName) {
          setBookError('Journal name cannot be empty.')
          setBookLoading(false)
          return
        }

        const bookRes = await fetch(`${API_BASE_URL}/api/books/${bookDetails.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedBookName }),
          credentials: 'include'
        })

        if (!bookRes.ok) {
          const bookData = await bookRes.json()
          setBookError(bookData.error || 'Failed to rename active journal.')
          setBookLoading(false)
          return
        }

        const updatedBook = await bookRes.json()
        onBookRename(updatedBook.name)
      }

      setBookSuccess(true)
    } catch (err) {
      console.error(err)
      setBookError('Server communication failure.')
    } finally {
      setBookLoading(false)
    }
  }

  // Save notifications preferences
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('bookchat_notify_sound', String(soundEnabled))
    localStorage.setItem('bookchat_notify_toasts', String(toastsEnabled))
    setNotifySuccess(true)
    setTimeout(() => setNotifySuccess(false), 2000)
  }

  // Save security password change
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault()
    setSecurityError(null)
    setSecuritySuccess(false)
    setSecurityLoading(true)

    if (newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match.')
      setSecurityLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters.')
      setSecurityLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include'
      })

      const data = await res.json()
      if (!res.ok) {
        setSecurityError(data.error || 'Failed to update passcode.')
      } else {
        setSecuritySuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      console.error(err)
      setSecurityError('Server communication failure.')
    } finally {
      setSecurityLoading(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none font-serif">
      {/* Settings Dialog Card Container */}
      <div className="relative w-full max-w-2xl bg-[#F4ECDD] rounded-[8px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#E3D5B8] flex h-[480px] overflow-hidden paper-texture animate-fade-in">
        
        {/* Left tabs selector pane */}
        <div className="w-1/3 bg-[#EDE3D0] border-r border-[#E3D5B8] p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="font-display font-bold text-lg text-[#4A3223] mb-4">⚙️ Settings</h3>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`text-left text-xs font-bold py-2 px-3 rounded transition-all cursor-pointer ${
                activeTab === 'profile' ? 'bg-[#F4ECDD] text-[#1F1B16] shadow-xs' : 'text-[#8c7f67] hover:bg-black/5'
              }`}
              aria-label="Profile tab settings"
            >
              Pen Name Profile
            </button>
            <button
              onClick={() => setActiveTab('book')}
              className={`text-left text-xs font-bold py-2 px-3 rounded transition-all cursor-pointer ${
                activeTab === 'book' ? 'bg-[#F4ECDD] text-[#1F1B16] shadow-xs' : 'text-[#8c7f67] hover:bg-black/5'
              }`}
              aria-label="Journal preferences tab settings"
            >
              Book Preferences
            </button>
            <button
              onClick={() => setActiveTab('interface')}
              className={`text-left text-xs font-bold py-2 px-3 rounded transition-all cursor-pointer ${
                activeTab === 'interface' ? 'bg-[#F4ECDD] text-[#1F1B16] shadow-xs' : 'text-[#8c7f67] hover:bg-black/5'
              }`}
              aria-label="Interface and guide tab settings"
            >
              Interface Options
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`text-left text-xs font-bold py-2 px-3 rounded transition-all cursor-pointer ${
                activeTab === 'notifications' ? 'bg-[#F4ECDD] text-[#1F1B16] shadow-xs' : 'text-[#8c7f67] hover:bg-black/5'
              }`}
              aria-label="Notification settings tab"
            >
              Alert Settings
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`text-left text-xs font-bold py-2 px-3 rounded transition-all cursor-pointer ${
                activeTab === 'security' ? 'bg-[#F4ECDD] text-[#1F1B16] shadow-xs' : 'text-[#8c7f67] hover:bg-black/5'
              }`}
              aria-label="Security settings tab"
            >
              🔒 Security Binders
            </button>
          </div>

          <button type="button"
        onClick={onLogout}
        className="text-[#B08D57] hover:text-[#EDE3D0] hover:scale-110 active:scale-95 transition cursor-pointer text-base bg-none border-none p-0 touch-target"
        aria-label="Logout scribe profile"
      >
        🚪 Logout Scribe
      </button>
        </div>

        {/* Right pane edit workspace content */}
        <div className="w-2/3 p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-base text-[#1F1B16] mb-1">Pen Name Profile</h4>
                <p className="text-[11px] text-[#8c7f67] italic mb-2">Configure how other scribes view your signature entries.</p>

                {profileSuccess && (
                  <div className="bg-[#6B7A4F]/10 border border-[#6B7A4F]/30 rounded text-[#6B7A4F] text-xs p-2">
                    ✓ Profile updated successfully in current logs.
                  </div>
                )}
                {profileError && (
                  <div className="bg-[#7A3B2E]/10 border border-[#7A3B2E]/30 rounded text-[#7A3B2E] text-xs p-2">
                    {profileError}
                  </div>
                )}

                <div className="flex flex-col text-left ink-underline-wrapper">
                  <label className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] mb-1">DisplayName Signature</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={25}
                    required
                    disabled={profileLoading}
                    aria-label="Edit display name"
                    className="ink-underline-input text-base p-1 text-[#1F1B16] placeholder-[#a89877] focus:bg-[#EDE3D0]/30 rounded-t px-2 transition-all duration-300"
                  />
                  <div className="ink-underline-bar" />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-bold text-xs py-2 px-4 rounded shadow-sm transition-all duration-200 cursor-pointer w-fit touch-target"
                >
                  {profileLoading ? 'Saving...' : 'Commit Pen Name'}
                </button>
              </form>
            )}

            {/* BOOK PREFERENCES TAB */}
            {activeTab === 'book' && (
              <form onSubmit={handleSaveBookPrefs} className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-base text-[#1F1B16] mb-1">Journal Preferences</h4>
                <p className="text-[11px] text-[#8c7f67] italic mb-2">Adjust defaults and rename ledger binders.</p>

                {bookSuccess && (
                  <div className="bg-[#6B7A4F]/10 border border-[#6B7A4F]/30 rounded text-[#6B7A4F] text-xs p-2">
                    ✓ Book preferences committed.
                  </div>
                )}
                {bookError && (
                  <div className="bg-[#7A3B2E]/10 border border-[#7A3B2E]/30 rounded text-[#7A3B2E] text-xs p-2">
                    {bookError}
                  </div>
                )}

                {/* Default Book dropdown selection */}
                <div className="flex flex-col text-left">
                  <label className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] mb-1">Default Open Book</label>
                  <select
                    value={defaultBookId}
                    onChange={(e) => setDefaultBookId(e.target.value)}
                    aria-label="Select default open book on login"
                    className="bg-[#EDE3D0] border border-black/5 rounded text-xs p-2 text-[#1F1B16] outline-none font-serif"
                  >
                    <option value="">-- None (Open Shelf) --</option>
                    {joinedBooks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rename book (if creator) */}
                {isCreator && (
                  <div className="flex flex-col text-left ink-underline-wrapper mt-2">
                    <label className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] mb-1">Rename Active Journal</label>
                    <input
                      type="text"
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      maxLength={40}
                      required
                      disabled={bookLoading}
                      aria-label="Rename active book"
                      className="ink-underline-input text-sm p-1 text-[#1F1B16] placeholder-[#a89877] focus:bg-[#EDE3D0]/30 rounded-t px-2 transition-all duration-300"
                    />
                    <div className="ink-underline-bar" />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={bookLoading}
                  className="bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-bold text-xs py-2 px-4 rounded shadow-sm transition-all duration-200 cursor-pointer w-fit touch-target"
                >
                  {bookLoading ? 'Updating...' : 'Save Book Prefs'}
                </button>
              </form>
            )}

            {/* INTERFACE TAB */}
            {activeTab === 'interface' && (
              <div className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-base text-[#1F1B16] mb-1">Interface Preferences</h4>
                <p className="text-[11px] text-[#8c7f67] italic mb-2">Re-initialize instruction cards or visual indicators.</p>

                <div className="flex flex-col text-left gap-2 border-b border-dashed border-[#B08D57]/30 pb-4 mb-2">
                  <label className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67]">Replay Tour Instructions</label>
                  <p className="text-[11px] text-[#3B352C] leading-normal m-0">Reset guided overlay tips explaining notebooks and spine ribbons.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onReplayTour()
                      onClose()
                    }}
                    className="bg-[#6B7A4F] hover:bg-[#52664A] text-[#EDE3D0] font-sans uppercase tracking-wider font-bold text-[10px] py-2 px-4 rounded shadow-sm w-fit transition cursor-pointer mt-1 touch-target"
                  >
                    🎗️ Replay Tour Overlay
                  </button>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <form onSubmit={handleSaveNotifications} className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-base text-[#1F1B16] mb-1">Alert Settings</h4>
                <p className="text-[11px] text-[#8c7f67] italic mb-2">Configure alerts without disrupting layout aesthetics.</p>

                {notifySuccess && (
                  <div className="bg-[#6B7A4F]/10 border border-[#6B7A4F]/30 rounded text-[#6B7A4F] text-xs p-2">
                    ✓ Notification alert settings saved locally.
                  </div>
                )}

                <div className="flex flex-col gap-3 text-left">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="accent-[#6B7A4F] w-4 h-4 cursor-pointer"
                      aria-label="Enable sound alert notifications"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#1F1B16] block">Acoustic Ink Notifications</span>
                      <span className="text-[10px] text-[#8c7f67]">Play a subtle soft droplet sound when new ink is committed to pages.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer select-none mt-2">
                    <input
                      type="checkbox"
                      checked={toastsEnabled}
                      onChange={(e) => setToastsEnabled(e.target.checked)}
                      className="accent-[#6B7A4F] w-4 h-4 cursor-pointer"
                      aria-label="Enable message preview toasts"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#1F1B16] block">Pop-up Text Previews</span>
                      <span className="text-[10px] text-[#8c7f67]">Show parchment note notifications at the top of the desk for incoming updates.</span>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  className="bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-bold text-xs py-2 px-4 rounded shadow-sm transition-all duration-200 cursor-pointer w-fit mt-2 touch-target"
                >
                  Save Alerts
                </button>
              </form>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <form onSubmit={handleSaveSecurity} className="flex flex-col gap-4">
                <h4 className="font-display font-bold text-base text-[#1F1B16] mb-1">Ledger Passcode</h4>
                <p className="text-[11px] text-[#8c7f67] italic mb-2">Change your scribe account access passcode with identity validation.</p>

                {securitySuccess && (
                  <div className="bg-[#6B7A4F]/10 border border-[#6B7A4F]/30 rounded text-[#6B7A4F] text-xs p-2">
                    ✓ Account passcode updated successfully.
                  </div>
                )}
                {securityError && (
                  <div className="bg-[#7A3B2E]/10 border border-[#7A3B2E]/30 rounded text-[#7A3B2E] text-xs p-2">
                    {securityError}
                  </div>
                )}

                <div className="flex flex-col text-left ink-underline-wrapper">
                  <label className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] mb-1">Current Passcode</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={securityLoading}
                    aria-label="Enter current passcode"
                    className="ink-underline-input text-sm p-1 text-[#1F1B16] placeholder-[#a89877] focus:bg-[#EDE3D0]/30 rounded-t px-2 transition-all duration-300"
                  />
                  <div className="ink-underline-bar" />
                </div>

                <div className="flex flex-col text-left ink-underline-wrapper mt-1">
                  <label className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] mb-1">New Passcode</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={securityLoading}
                    aria-label="Enter new passcode"
                    className="ink-underline-input text-sm p-1 text-[#1F1B16] placeholder-[#a89877] focus:bg-[#EDE3D0]/30 rounded-t px-2 transition-all duration-300"
                  />
                  <div className="ink-underline-bar" />
                </div>

                <div className="flex flex-col text-left ink-underline-wrapper mt-1">
                  <label className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] mb-1">Confirm New Passcode</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={securityLoading}
                    aria-label="Confirm new passcode"
                    className="ink-underline-input text-sm p-1 text-[#1F1B16] placeholder-[#a89877] focus:bg-[#EDE3D0]/30 rounded-t px-2 transition-all duration-300"
                  />
                  <div className="ink-underline-bar" />
                </div>

                <button
                  type="submit"
                  disabled={securityLoading}
                  className="bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-bold text-xs py-2 px-4 rounded shadow-sm transition-all duration-200 cursor-pointer w-fit touch-target"
                >
                  {securityLoading ? 'Saving...' : 'Update Passcode'}
                </button>

                <div className="flex flex-col gap-2 border-t border-dashed border-[#B08D57]/30 pt-4 mt-4 animate-fade-in">
                  <span className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] font-bold">Active Scribe Session</span>
                  <div className="bg-[#EDE3D0]/40 rounded p-3 border border-black/5 text-[11px] text-[#3B352C] font-serif flex flex-col gap-1 leading-normal">
                    <div><strong>Registered Email:</strong> {user.email}</div>
                    <div><strong>Scribe ID:</strong> <span className="font-sans select-all text-[10px] bg-black/5 px-1 rounded">{user.id}</span></div>
                    <div><strong>Session Authentication:</strong> Cookie-bound JSON Web Token</div>
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="flex justify-end border-t border-[#E3D5B8] pt-4 mt-4">
            <button
              onClick={onClose}
              className="bg-transparent border border-[#7A3B2E] text-[#7A3B2E] hover:bg-[#7A3B2E]/5 font-bold text-xs py-2 px-6 rounded transition cursor-pointer"
              aria-label="Close settings modal"
            >
              Close Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
