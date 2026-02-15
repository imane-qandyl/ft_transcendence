import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { CHARACTER_SPRITES } from '../constants/characters';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null); // holds the active image URL (from DB or local preview)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Username and email editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDeleteAccount = async () => {
    if (!userData?.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`users/${userData.id}`);
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleteError(err.response?.data?.message || err.response?.data?.error || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCharacter();
    fetchMatches();
    fetchUsers();
  }, []);

  // Sync profilePicture from the fetched userData once it arrives
  useEffect(() => {
    if (userData?.avatar_url) {
      setProfilePicture(userData.avatar_url);
    }
  }, [userData]);

  useEffect(() => {
    if (!users || !matches || !user || !users.length || !matches.length) return;
    const leaderboardData = calculateLeaderboard(users, matches, user);
    setUserData(prev => ({
      ...prev,
      ...leaderboardData
    }));
  }, [users, matches, user]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('users/me');
      setUserData(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacter = async () => {
    try {
      const response = await api.get('characters/me');
      setCharacter(response.data.character);
    } catch (err) {
      console.error('No character found');
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await api.get('matches');
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Failed to fetch match Data', error);
      setMatches([]); // Ensure matches is always an array
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users Data', error);
      setUsers([]); // Ensure users is always an array
    }
  };

  // ─── PROFILE PICTURE HANDLERS ───────────────────────────────────

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic client-side validation
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be under 2 MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Convert the file to a Base64 data URI.
      // This is a real, self-contained string (not a blob URL) so the backend
      // can store it directly in avatar_url with no issues.
      // 🔴 Replace this whole block with a Cloudinary upload later —
      //    just swap `imageUrl` for the Cloudinary URL it returns.
      const imageUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // "data:image/png;base64,..."
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Persist to backend (updates users.avatar_url in DB)
      if (!userData?.id) {
        throw new Error('User ID not available');
      }
      await api.put(`users/${userData.id}`, { avatar_url: imageUrl });

      // Update local state immediately so the UI reflects the change
      setProfilePicture(imageUrl);
      setUserData(prev => ({ ...prev, avatar_url: imageUrl }));
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the hidden input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      // Send null (or empty string) to clear avatar_url in the DB
      if (!userData?.id) {
        throw new Error('User ID not available');
      }
      await api.put(`users/${userData.id}`, { avatar_url: null });

      // Clear local state — this triggers the fallback to the sprite avatar
      setProfilePicture(null);
      setUserData(prev => ({ ...prev, avatar_url: null }));
    } catch (err) {
      console.error('Remove failed:', err);
      setUploadError('Failed to remove picture. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-retro-purple text-xs pixel-blink">LOADING PROFILE...</div>
      </div>
    );
  }

  const currentSprite = CHARACTER_SPRITES.find(s =>
    s.id === (character?.customization?.selected_character || character?.sprite_body)
  ) || CHARACTER_SPRITES[0];

  // ─── STATS CALCULATION (unchanged) ─────────────────────────────

  const userId = user?.id;
  const matchArray = matches || [];

  const draws = matchArray.filter(m => m.status === 'completed' && m.winner_id == null).length;

  let currentWinStreak = 0;
  for (let i = matchArray.length - 1; i >= 0; i--) {
    const m = matchArray[i];
    if (m.status !== 'completed') continue;
    if (m.winner_id === userId) currentWinStreak++;
    else break;
  }

  let longestWinStreak = 0, tempStreak = 0;
  for (const m of matchArray) {
    if (m.status !== 'completed') continue;
    if (m.winner_id === userId) {
      tempStreak++;
      if (tempStreak > longestWinStreak) longestWinStreak = tempStreak;
    } else tempStreak = 0;
  }

  const userMatches = (matches || []).filter(m =>
    m.status === 'completed' &&
    (m.player1_id === userId || m.player2_id === userId)
  );

  const totalGames = userMatches.length;

  const pointsLost = matchArray.reduce((acc, m) => {
    if (m.status !== 'completed') return acc;
    if (m.player1_id === userId) return acc + (m.player2_score || 0);
    if (m.player2_id === userId) return acc + (m.player1_score || 0);
    return acc;
  }, 0);

  // ─── MAIN RETURN ────────────────────────────────────────────────

  return (
    <div className="h-full p-4 space-y-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-retro-purple text-lg pixel-text">
          {'> PLAYER PROFILE <'}
        </h1>
      </div>

      {/* Main Profile Card */}
      <div className="pixel-card p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">

          {/* Avatar Box — shows profile picture OR sprite fallback */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="pixel-card bg-pixel-black inline-block">
              <div className="w-32 h-32 border-3 border-pixel-light flex items-center justify-center overflow-hidden bg-pixel-black">
                {profilePicture ? (
                  /* ── Custom profile picture ── */
                  <img
                    src={profilePicture}
                    alt="Profile Picture"
                    className="w-full h-full object-cover"
                  />
                ) : character ? (
                  /* ── Sprite avatar fallback ── */
                  <div
                    className="[image-rendering:pixelated]"
                    style={{
                      backgroundImage: `url(${currentSprite.sprite})`,
                      backgroundSize: currentSprite.size === 'large' ? '384px 96px' : '128px 32px',
                      backgroundPosition: '0 0',
                      width: currentSprite.size === 'large' ? '96px' : '32px',
                      height: currentSprite.size === 'large' ? '96px' : '32px',
                      transform: currentSprite.size === 'large' ? 'scale(1.3)' : 'scale(3.5)',
                    }}
                  />
                ) : (
                  /* ── Last-resort fallback: initial letter ── */
                  <div className="text-pixel-mid text-4xl">
                    {userData?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </div>

            {/* Character level badge (still shown below the box) */}
            {character && (
              <div className="text-center mt-2">
                <div className="text-retro-purple text-xs">
                  LV.{character.level} {currentSprite.name?.toUpperCase()}
                </div>
              </div>
            )}

            {/* Upload / Remove controls */}
            {/* Upload / Remove controls */}
<div className="mt-3 flex flex-col items-center gap-2">
  {/* Hidden file input — triggered by the button click */}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleUpload}
    className="hidden"
  />

  {/* Upload button — pixel style */}
  <button
    onClick={() => fileInputRef.current?.click()}
    disabled={isUploading}
    style={{
      fontFamily: 'inherit',
      fontSize: '10px',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      color: '#000',
      background: isUploading ? '#555' : '#f7c948',
      border: 'none',
      padding: '6px 14px',
      cursor: isUploading ? 'not-allowed' : 'pointer',
      imageRendering: 'pixelated',
      boxShadow: isUploading
        ? '3px 3px 0px #333'
        : '3px 3px 0px #b8932a',
      transform: 'translate(0px, 0px)',
      transition: 'transform 0.05s, box-shadow 0.05s',
      userSelect: 'none',
      outline: 'none',
    }}
    onMouseDown={e => {
      if (!isUploading) {
        e.currentTarget.style.transform = 'translate(2px, 2px)';
        e.currentTarget.style.boxShadow = '1px 1px 0px #b8932a';
      }
    }}
    onMouseUp={e => {
      e.currentTarget.style.transform = 'translate(0px, 0px)';
      e.currentTarget.style.boxShadow = '3px 3px 0px #b8932a';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translate(0px, 0px)';
      e.currentTarget.style.boxShadow = isUploading ? '3px 3px 0px #333' : '3px 3px 0px #b8932a';
    }}
  >
    {isUploading
      ? '⏳ Uploading...'
      : profilePicture
        ? '📷 Change Pic'
        : '📷 Upload Pic'}
  </button>

  {/* Remove button — pixel style, only shown when a profile picture is active */}
  {profilePicture && (
    <button
      onClick={handleRemove}
      disabled={isUploading}
      style={{
        fontFamily: 'inherit',
        fontSize: '9px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: '#fff',
        background: isUploading ? '#444' : '#c0392b',
        border: 'none',
        padding: '4px 10px',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        imageRendering: 'pixelated',
        boxShadow: isUploading
          ? '2px 2px 0px #222'
          : '2px 2px 0px #7b2d22',
        transform: 'translate(0px, 0px)',
        transition: 'transform 0.05s, box-shadow 0.05s',
        userSelect: 'none',
        outline: 'none',
      }}
      onMouseDown={e => {
        if (!isUploading) {
          e.currentTarget.style.transform = 'translate(1px, 1px)';
          e.currentTarget.style.boxShadow = '1px 1px 0px #7b2d22';
        }
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = 'translate(0px, 0px)';
        e.currentTarget.style.boxShadow = '2px 2px 0px #7b2d22';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translate(0px, 0px)';
        e.currentTarget.style.boxShadow = isUploading ? '2px 2px 0px #222' : '2px 2px 0px #7b2d22';
      }}
    >
      {isUploading ? '...' : '✕ Remove'}
    </button>
  )}

  {/* Error message */}
  {uploadError && (
    <div className="text-retro-red text-xs mt-1 pixel-text">{uploadError}</div>
  )}
</div>
          </div>

          {/* User Info */}
          <div className="flex-1 w-full">
            <div className="mb-4">
              <div className="text-pixel-white text-sm mb-1">USERNAME</div>
              {!isEditing ? (
                <div className="text-pixel-mid text-base pixel-text">{userData?.username}</div>
              ) : (
                <input
                  className="w-full p-2 bg-pixel-black text-pixel-mid border-2 border-pixel-light"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              )}
            </div>
            <div className="mb-4">
              <div className="text-pixel-white text-sm mb-1">EMAIL</div>
              {!isEditing ? (
                <div className="text-pixel-mid text-base pixel-text">{userData?.email}</div>
              ) : (
                <input
                  className="w-full p-2 bg-pixel-black text-pixel-mid border-2 border-pixel-light"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                />
              )}
            </div>

            {/* Edit button */}
            {!isEditing && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditName(userData?.username || '');
                    setEditEmail(userData?.email || '');
                  }}
                  className="px-4 py-2 bg-retro-purple border-3 border-retro-purple text-pixel-black text-sm hover:brightness-110"
                >
                  Edit Profile
                </button>
              </div>
            )}

            {/* Save/Cancel buttons */}
            {isEditing && (
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={async () => {
                    setEditError(null);
                    // basic validation
                    if (!editName || editName.trim().length < 1) {
                      setEditError('Username is required');
                      return;
                    }
                    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
                    if (!editEmail || !emailRegex.test(editEmail)) {
                      setEditError('Enter a valid email');
                      return;
                    }

                    setIsSaving(true);
                    try {
                      const payload = { username: editName.trim(), email: editEmail.trim() };
                      await api.put(`users/${userData.id}`, payload);
                      // Refresh local profile data
                      const resp = await api.get('users/me');
                      setUserData(resp.data);
                      setIsEditing(false);
                      setEditError(null);
                    } catch (err) {
                      console.error('Save failed', err);
                      const msg = err.response?.data?.message || err.response?.data?.error || 'Save failed';
                      setEditError(msg);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 bg-retro-green text-pixel-black text-sm border-3 border-retro-green hover:brightness-110 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>

                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(userData?.username || '');
                    setEditEmail(userData?.email || '');
                    setEditError(null);
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 bg-pixel-black text-pixel-mid text-sm border-3 border-pixel-light hover:brightness-110 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Error message */}
            {editError && (
              <div className="text-retro-red text-xs mb-2 pixel-text">{editError}</div>
            )}
          </div>

        </div>
      </div>

      {/* Stats Grid (unchanged) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="*" label="ELO" value={character?.elo_rating} color="text-retro-yellow" />
        <StatCard icon="+" label="WINS" value={character?.wins} color="text-retro-green" />
        <StatCard icon="-" label="LOSSES" value={character?.losses} color="text-retro-red" />
        <StatCard
          icon="%"
          label="WIN RATE"
          value={`${character?.wins + character?.losses > 0 ? Math.round(character?.wins / (character?.wins + character?.losses) * 100) : 0}%`}
          color="text-retro-purple"
        />
      </div>

      {/* Detailed Stats (unchanged) */}
      <div className="pixel-card p-4">
        <div className="text-pixel-white text-sm mb-3 text-center">
          {'[ BATTLE STATISTICS ]'}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MiniStat label="TOTAL WIN GAMES" value={((character?.wins || 0))} />
          <MiniStat label="DRAWS" value={draws || 0} />
          <MiniStat label="WIN STREAK" value={currentWinStreak || 0} />
          <MiniStat label="BEST STREAK" value={longestWinStreak || 0} />
          <MiniStat label="POINTS SCORED" value={character?.stat_points || 0} />
          <MiniStat label="POINTS LOST" value={character?.losses || 0} />
        </div>
      </div>

      {/* 🏆 LEADERBOARD SECTION (unchanged) */}
      <div className="pixel-card p-4">
        <div className="text-center mb-4">
          <h2 className="text-retro-yellow text-lg pixel-text">
            {'🏆 GLOBAL LEADERBOARD 🏆'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="pixel-card p-4 bg-pixel-black">
            <div className="text-center">
              <div className="text-pixel-mid text-xs mb-2">YOUR RANK</div>
              <div className="text-retro-purple text-4xl pixel-text mb-1">
                #{userData?.leaderboard_rank || '?'}
              </div>
              <div className="text-pixel-mid text-xs">
                OUT OF {userData?.total_players || 0} PLAYERS
              </div>
            </div>
          </div>

          <div className="pixel-card p-4 bg-pixel-black">
            <div className="text-pixel-mid text-xs mb-2 text-center">TOP 3 PLAYERS</div>
            <div className="space-y-2">
              {userData?.leaderboard_top_10?.slice(0, 3).map((player, index) => (
                <div key={player.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className={`pixel-text ${player.is_current_user ? 'text-retro-green' : 'text-pixel-white'}`}>
                      {player.username}
                      {player.is_current_user && ' (YOU)'}
                    </span>
                  </div>
                  <span className="text-retro-yellow">{player.rating}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-pixel-light">
                <th className="text-left p-2 text-pixel-white">RANK</th>
                <th className="text-left p-2 text-pixel-white">PLAYER</th>
                <th className="text-center p-2 text-pixel-white">ELO</th>
                <th className="text-center p-2 text-pixel-white">W-L</th>
                <th className="text-center p-2 text-pixel-white">WIN %</th>
              </tr>
            </thead>
            <tbody>
              {userData?.leaderboard_top_10?.map((player) => (
                <tr
                  key={player.id}
                  className={`border-b border-pixel-dark ${
                    player.is_current_user
                      ? 'bg-retro-purple bg-opacity-20 text-retro-green'
                      : 'text-pixel-mid'
                  }`}
                >
                  <td className="p-2">
                    <span className="pixel-text">
                      {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : `#${player.rank}`}
                    </span>
                  </td>
                  <td className="p-2 pixel-text">
                    {player.username}
                    {player.is_current_user && (
                      <span className="ml-2 text-retro-green">◄ YOU</span>
                    )}
                  </td>
                  <td className="text-center p-2 text-retro-yellow pixel-text">
                    {player.rating}
                  </td>
                  <td className="text-center p-2 pixel-text">
                    {player.wins}-{player.losses}
                  </td>
                  <td className="text-center p-2 pixel-text">
                    {player.win_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {userData?.total_players > 10 && (
          <div className="text-center mt-4">
            <div className="text-pixel-mid text-xs">
              Showing top 10 of {userData?.total_players} players
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Section */}
      <div className="pixel-card p-4">
        <div className="text-pixel-white text-sm mb-3 text-center">
          {'[ DANGER ZONE ]'}
        </div>
        <div className="text-center">
          <p className="text-pixel-mid text-xs mb-3">
            Permanently delete your account and all associated data (characters, matches, messages, friends).
          </p>
          {deleteError && (
            <div className="text-retro-red text-xs mb-3 pixel-text">{deleteError}</div>
          )}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                fontFamily: 'inherit',
                fontSize: '10px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#fff',
                background: '#c0392b',
                border: 'none',
                padding: '8px 20px',
                cursor: 'pointer',
                imageRendering: 'pixelated',
                boxShadow: '3px 3px 0px #7b2d22',
                transform: 'translate(0px, 0px)',
                transition: 'transform 0.05s, box-shadow 0.05s',
                userSelect: 'none',
                outline: 'none',
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'translate(2px, 2px)';
                e.currentTarget.style.boxShadow = '1px 1px 0px #7b2d22';
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'translate(0px, 0px)';
                e.currentTarget.style.boxShadow = '3px 3px 0px #7b2d22';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translate(0px, 0px)';
                e.currentTarget.style.boxShadow = '3px 3px 0px #7b2d22';
              }}
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-retro-red text-xs pixel-text">
                Are you sure? This action cannot be undone!
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: '#fff',
                    background: isDeleting ? '#555' : '#e74c3c',
                    border: 'none',
                    padding: '8px 20px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    imageRendering: 'pixelated',
                    boxShadow: isDeleting ? '3px 3px 0px #333' : '3px 3px 0px #962d22',
                    userSelect: 'none',
                    outline: 'none',
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                  disabled={isDeleting}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: '10px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: '#000',
                    background: '#aaa',
                    border: 'none',
                    padding: '8px 20px',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    imageRendering: 'pixelated',
                    boxShadow: '3px 3px 0px #666',
                    userSelect: 'none',
                    outline: 'none',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

// ─── SUB-COMPONENTS (unchanged) ───────────────────────────────────

const StatCard = ({ icon, label, value, color }) => (
  <div className="pixel-card p-4 text-center">
    <div className={`text-2xl ${color} pixel-text mb-1`}>
      [{icon}] {value}
    </div>
    <div className="text-pixel-mid text-[8px]">
      {label}
    </div>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="text-center">
    <div className="text-retro-purple text-sm pixel-text">
      {value}
    </div>
    <div className="text-pixel-mid text-[8px] mt-1">
      {label}
    </div>
  </div>
);

// ─── LEADERBOARD CALCULATION (unchanged) ─────────────────────────

const calculateLeaderboard = (users, matches, currentUser) => {
  const BASE_ELO = 1000;
  const stats = {};

  users.forEach(u => {
    stats[u.id] = {
      id: u.id,
      username: u.username,
      rating: BASE_ELO,
      wins: 0,
      losses: 0,
      matches: 0
    };
  });

  matches.filter(m =>
    m.match_type === 'ranked' &&
    m.status === 'completed' &&
    m.winner_id
  ).forEach(m => {
    const p1 = stats[m.player1_id];
    const p2 = stats[m.player2_id];
    if (!p1 || !p2) {
      console.warn('User missing for match', m);
      return;
    }

    p1.matches++;
    p2.matches++;

    p1.rating += m.player1_elo_change || 0;
    p2.rating += m.player2_elo_change || 0;

    if (m.winner_id === p1.id) {
      p1.wins++;
      p2.losses++;
    } else if (m.winner_id === p2.id) {
      p2.wins++;
      p1.losses++;
    }
  });

  Object.values(stats).forEach(p => {
    p.win_rate = p.matches
      ? Math.round((p.wins / p.matches) * 100)
      : 0;
  });

  const leaderboard = Object.values(stats)
    .sort((a, b) => b.rating - a.rating)
    .map((p, i) => ({
      ...p,
      rank: i + 1,
      is_current_user: p.id === currentUser.id
    }));

  return {
    leaderboard_top_10: leaderboard.slice(0, 10),
    leaderboard_rank: leaderboard.find(p => p.id === currentUser.id)?.rank,
    total_players: leaderboard.length
  };
};

export default Profile;