import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function Household() {
  const [household, setHousehold] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [createName, setCreateName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get('/households/me').then(({ data }) => setHousehold(data)).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await api.post('/households', { name: createName })
      setHousehold(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create')
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data } = await api.post('/households/join', { inviteCode: joinCode })
      setHousehold(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code')
    } finally {
      setBusy(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Leave this household? Your items will stay but become private.')) return
    setBusy(true)
    try {
      await api.post('/households/leave')
      setHousehold(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to leave')
    } finally {
      setBusy(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(household.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="loading">Loading…</div>

  return (
    <div className="page household-page">
      <div className="page-header">
        <h2>Household</h2>
        <p className="page-subtitle">Share your food inventory with family or housemates</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {household ? (
        <div className="household-card">
          <div className="household-header">
            <div>
              <h3>{household.name}</h3>
              <p className="household-owner">Owner: {household.owner.name}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLeave} disabled={busy}>
              Leave
            </button>
          </div>

          <div className="invite-section">
            <p className="section-title">Invite code</p>
            <div className="invite-code-row">
              <span className="invite-code">{household.inviteCode}</span>
              <button className="btn btn-secondary btn-sm" onClick={copyCode}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="invite-hint">Share this code so others can join your household.</p>
          </div>

          <div className="members-section">
            <p className="section-title">Members ({household.members.length})</p>
            <ul className="members-list">
              {household.members.map((m) => (
                <li key={m._id} className="member-item">
                  <span className="member-avatar">{m.name[0].toUpperCase()}</span>
                  <span className="member-name">{m.name}</span>
                  <span className="member-email">{m.email}</span>
                  {m._id === household.owner._id && <span className="member-badge">Owner</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="household-setup">
          <div className="setup-card">
            <h3>Create a household</h3>
            <p>Start a new shared inventory for your home.</p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Household name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Our Home"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                Create household
              </button>
            </form>
          </div>

          <div className="setup-divider">or</div>

          <div className="setup-card">
            <h3>Join a household</h3>
            <p>Enter an invite code from someone in your home.</p>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>Invite code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={busy}>
                Join household
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
