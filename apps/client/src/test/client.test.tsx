import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeftHardcoverNav } from '../components/book/LeftHardcoverNav'
import { ComposerBar } from '../components/book/ComposerBar'
import { MessageEntry } from '../components/book/MessageEntry'

describe('LeftHardcoverNav', () => {
  test('renders all navigation buttons and handles clicks', () => {
    const onShowSwitcher = vi.fn()
    const onGoToShelf = vi.fn()
    const onLogout = vi.fn()
    const onShowSettings = vi.fn()

    render(
      <LeftHardcoverNav
        onShowSwitcher={onShowSwitcher}
        onGoToShelf={onGoToShelf}
        onLogout={onLogout}
        onShowSettings={onShowSettings}
      />
    )

    // Verify buttons by their ARIA labels
    const shelfBtn = screen.getByLabelText('Bookshelf directories')
    const switcherBtn = screen.getByLabelText('Switch journal ledger')
    const settingsBtn = screen.getByLabelText('Open ledger settings')
    const logoutBtn = screen.getByLabelText('Logout scribe profile')

    expect(shelfBtn).toBeInTheDocument()
    expect(switcherBtn).toBeInTheDocument()
    expect(settingsBtn).toBeInTheDocument()
    expect(logoutBtn).toBeInTheDocument()

    fireEvent.click(shelfBtn)
    expect(onGoToShelf).toHaveBeenCalledTimes(1)

    fireEvent.click(switcherBtn)
    expect(onShowSwitcher).toHaveBeenCalledTimes(1)

    fireEvent.click(settingsBtn)
    expect(onShowSettings).toHaveBeenCalledTimes(1)

    fireEvent.click(logoutBtn)
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})

describe('ComposerBar', () => {
  test('displays character count when text is entered', () => {
    const onChange = vi.fn()
    const onKeyDown = vi.fn()
    const onSend = vi.fn()

    const { rerender } = render(
      <ComposerBar
        composerText=""
        onChange={onChange}
        onKeyDown={onKeyDown}
        onSend={onSend}
      />
    )

    // Count is not displayed when empty
    expect(screen.queryByText(/500/)).not.toBeInTheDocument()

    // Render again with text
    rerender(
      <ComposerBar
        composerText="Spilling some ink..."
        onChange={onChange}
        onKeyDown={onKeyDown}
        onSend={onSend}
      />
    )

    expect(screen.getByText('20/500')).toBeInTheDocument()
  })

  test('disables send button when text is empty', () => {
    const onChange = vi.fn()
    const onKeyDown = vi.fn()
    const onSend = vi.fn()

    render(
      <ComposerBar
        composerText="   "
        onChange={onChange}
        onKeyDown={onKeyDown}
        onSend={onSend}
      />
    )

    const sendBtn = screen.getByLabelText('Send ink message to ledger')
    expect(sendBtn).toBeDisabled()
  })
})

import { ThemePullTab } from '../components/theme/ThemePullTab'

describe('MessageEntry', () => {
  test('renders message content and sender name', () => {
    const msg = {
      id: 'msg-1',
      content: 'Hello fellow scribe!',
      createdAt: new Date().toISOString(),
      sender: { displayName: 'John Doe' },
      status: 'sent'
    }

    render(
      <MessageEntry
        msg={msg}
        isMe={false}
        isHighlighted={false}
        highlightText={(t) => t}
        searchQuery=""
      />
    )

    expect(screen.getByText('Hello fellow scribe!')).toBeInTheDocument()
    expect(screen.getByText(/JOHN DOE/)).toBeInTheDocument()
  })
})

describe('ThemePullTab', () => {
  test('renders all 4 swatches and triggers theme change', () => {
    const onThemeChange = vi.fn()

    render(
      <ThemePullTab
        currentTheme="paper"
        onThemeChange={onThemeChange}
      />
    )

    const swatches = screen.getAllByRole('radio')
    expect(swatches).toHaveLength(4)

    fireEvent.click(swatches[1])
    expect(onThemeChange).toHaveBeenCalledWith('cabinet')
  })
})
