import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Folder,
  Image,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Search,
  User,
  X,
  Layers,
  Settings,
  Check,
  Pencil,
  Upload,
  CreditCard,
  Package,
  Share2,
  LogOut,
  Table2,
  HelpCircle,
  ArrowDownRight,
  Filter,
  Lock,
  Unlock,
  Calculator,
} from 'lucide-react'
import TutorialOverlay from './TutorialOverlay'
import { DEFAULT_FIELD_OPTIONS } from '../data/fieldConfig'
import { signInWithGoogle, linkAnonymousWithGoogle, signOut } from '../firebase'
import {
  GRADE_OPTIONS,
  GRADE_NUMBERS,
  LANGUAGE_OPTIONS,
  THUMBNAIL_ICONS,
} from '../data/fieldConfig'

export default function MainContent({
  showProfileView,
  userId,
  user,
  userProfile,
  selectedCollection,
  currentCollection,
  displayedItems,
  currentItems,
  searchQuery,
  showSearchInput,
  viewMode,
  sortBy,
  onAddItem,
  onAddMultiple,
  onOpenCollectionEdit,
  onOpenCollectionDelete,
  onShareCollection,
  onEditItem,
  onDeleteItem,
  onSaveInlineItem,
  onUploadImage,
  onSortChange,
  onViewModeChange,
  onSearchChange,
  onSearchToggle,
  onSearchClear,
  onUpdateCollection,
  items,
  filters,
  onFiltersChange,
  deleteAllUserData,
  onUpdateUserProfile,
}) {
  const [editMode, setEditMode] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState(new Set())
  const [draftNewItem, setDraftNewItem] = useState(null)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingItemData, setEditingItemData] = useState(null)
  const [showCollectionMenu, setShowCollectionMenu] = useState(false)
  const [showFieldManageModal, setShowFieldManageModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showCalculatorModal, setShowCalculatorModal] = useState(false)
  const [showFieldVisibilityModal, setShowFieldVisibilityModal] = useState(false)
  const [showShareLinkModal, setShowShareLinkModal] = useState(false)
  const [showShareManageModal, setShowShareManageModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [shareLinkUrl, setShareLinkUrl] = useState('')
  const [selectedItemDetail, setSelectedItemDetail] = useState(null)
  const [fieldVisibility, setFieldVisibility] = useState({}) // { fieldKey: 0 or 1 }
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)
  
  // 튜토리얼용 refs
  const editModeButtonRef = useRef(null)
  const fieldManageButtonRef = useRef(null)
  const addItemButtonRef = useRef(null)
  const viewModeButtonRef = useRef(null)
  
  // 전체 아이템 개수 계산
  const totalItems = Object.keys(items || {}).length

  useEffect(() => {
    if (showCollectionMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [showCollectionMenu])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target)
      ) {
        setShowCollectionMenu(false)
      }
    }
    if (showCollectionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCollectionMenu])

  const [isLinking, setIsLinking] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Tab 키로 에디트 모드 토글
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tab 키만 눌렀을 때 (다른 키와 조합이 아닐 때)
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // input, textarea, select 등이 포커스되어 있지 않을 때만
        const activeElement = document.activeElement
        const isInputFocused = 
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          activeElement?.tagName === 'SELECT' ||
          activeElement?.isContentEditable
        
        if (!isInputFocused && selectedCollection) {
          e.preventDefault()
          // 튜토리얼 중이면 실제 기능 실행 안 함
          if (totalItems === 0 && !userProfile?.tutorialCompleted) {
            return
          }
          setEditMode((prev) => {
            if (prev) {
              setSelectedItemIds(new Set())
              setDeleteMode(false)
            }
            return !prev
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCollection])

  const handleGoogleLogin = async () => {
    if (!user) return
    
    setIsLinking(true)
    try {
      if (user.isAnonymous) {
        // 익명 계정을 Google 계정으로 연결
        await linkAnonymousWithGoogle()
      } else {
        // 이미 로그인된 경우 Google 로그인
        await signInWithGoogle()
      }
    } catch (error) {
      console.error('Google 로그인 실패:', error)
      alert('Google 로그인에 실패했습니다: ' + error.message)
    } finally {
      setIsLinking(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      // 로그아웃 후 로그인 페이지로 리다이렉트 (App.jsx에서 처리)
      window.location.href = '/login'
    } catch (error) {
      console.error('로그아웃 실패:', error)
      alert('로그아웃에 실패했습니다: ' + error.message)
      setIsSigningOut(false)
    }
  }

  if (showProfileView) {
    // 디버깅: user 정보 확인
    console.log('프로필 페이지 - user 정보:', {
      user,
      isAnonymous: user?.isAnonymous,
      email: user?.email,
      displayName: user?.displayName,
    })
    
    const isAnonymous = user?.isAnonymous ?? true
    const displayName = user?.displayName || '익명 사용자'
    const email = user?.email
    const photoURL = user?.photoURL

    return (
      <>
        {/* 모바일: 상단 헤더 공간 확보 */}
        <div className="md:hidden h-[120px] flex-shrink-0" />
        
        <header className="px-4 md:px-10 py-4 md:py-7 bg-zinc-800/30 backdrop-blur border-b border-zinc-700/50">
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">
            프로필
          </h2>
          <p className="text-sm text-zinc-400 mt-1">계정 정보 및 설정</p>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl">
            <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700/50 p-8">
              <div className="flex items-center gap-6 mb-8">
                {photoURL ? (
                  <img 
                    src={photoURL} 
                    alt={displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-zinc-600"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                    <User size={40} className="text-zinc-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-zinc-100">{displayName}</h3>
                  {email ? (
                    <p className="text-sm text-zinc-400 mt-1">{email}</p>
                  ) : (
                    <p className="text-sm text-zinc-400 mt-1">
                      Google 로그인을 연결하면 이메일이 표시됩니다
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {isAnonymous ? (
                  <>
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isLinking}
                      className="w-full px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isLinking ? (
                        <>로딩 중...</>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google로 로그인
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full px-6 py-3 rounded-xl font-semibold bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} />
                      {isSigningOut ? '로그아웃 중...' : '로그아웃'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full px-6 py-3 rounded-xl font-semibold bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} />
                    {isSigningOut ? '로그아웃 중...' : '로그아웃'}
                  </button>
                )}

                <div className="mt-6 pt-6 border-t border-zinc-700/50">
                  <p className="text-xs text-zinc-500 mb-1">사용자 ID (UID):</p>
                  <p className="text-xs text-zinc-400 font-mono break-all bg-zinc-900/50 p-2 rounded">
                    {userId}
                  </p>
                  <p className="text-xs text-zinc-600 mt-2">
                    {isAnonymous 
                      ? '익명 계정입니다. Google 로그인을 연결하면 데이터가 유지됩니다.'
                      : 'Google 계정으로 로그인되어 있습니다.'}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-700/50">
                  <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    disabled={isDeletingAccount}
                    className="w-full px-6 py-3 rounded-xl font-semibold bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    {isDeletingAccount ? '탈퇴 중...' : '회원탈퇴'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 회원탈퇴 확인 모달 */}
        {showDeleteAccountModal && (
          <DeleteAccountModal
            onClose={() => setShowDeleteAccountModal(false)}
            onConfirm={async () => {
              setIsDeletingAccount(true)
              try {
                // 1. 모든 공유 컬렉션 삭제
                const { deleteAllSharedCollections } = await import('../data/shareCollection')
                await deleteAllSharedCollections(userId)

                // 2. 모든 개인 데이터 삭제
                await deleteAllUserData?.()

                // 3. Firebase Auth에서 사용자 계정 삭제
                const { deleteUserAccount } = await import('../firebase')
                await deleteUserAccount()

                // 4. 로그인 페이지로 리다이렉트
                window.location.href = '/login?message=회원탈퇴가 완료되었습니다.'
              } catch (e) {
                console.error('회원탈퇴 실패:', e)
                alert('회원탈퇴 중 오류가 발생했습니다: ' + e.message)
              } finally {
                setIsDeletingAccount(false)
              }
            }}
            isDeleting={isDeletingAccount}
          />
        )}
      </>
    )
  }

  return (
    <>
      <header className="px-10 py-7 bg-zinc-800/30 backdrop-blur border-b border-zinc-700/50 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">
              {currentCollection?.name || '컬렉션 선택'}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {searchQuery
                ? `${displayedItems.length}개 (검색 결과)`
                : `${currentItems.length}개 아이템`}
            </p>
          </div>
          {selectedCollection && currentCollection && (
            <button
              onClick={() => {
                // 필드 visibility 초기화 (기존 설정이 있으면 유지)
                if (currentCollection?.itemFields) {
                  const initialVisibility = {}
                  currentCollection.itemFields.forEach(field => {
                    initialVisibility[field.key] = currentCollection.fieldVisibility?.[field.key] ?? 0 // 기본값은 0 (공개)
                  })
                  setFieldVisibility(initialVisibility)
                }
                setShowFieldVisibilityModal(true)
              }}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
              title="필드 공개 범위 설정"
            >
              <Lock size={20} />
            </button>
          )}
        </div>
        {selectedCollection && (
          <div className="relative">
            <button
              ref={menuButtonRef}
              onClick={(e) => {
                e.stopPropagation()
                setShowCollectionMenu((prev) => !prev)
              }}
              className="p-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
              aria-label="컬렉션 설정"
            >
              <Settings size={24} />
            </button>
            {showCollectionMenu &&
              createPortal(
                <div
                  ref={menuRef}
                  className="fixed py-2 min-w-[140px] rounded-xl bg-zinc-800 border border-zinc-600 shadow-xl z-[1100]"
                  style={{ top: menuPosition.top, right: menuPosition.right }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      // 필드 visibility 초기화 (기존 설정이 있으면 유지)
                      if (currentCollection?.itemFields) {
                        const initialVisibility = {}
                        currentCollection.itemFields.forEach(field => {
                          initialVisibility[field.key] = currentCollection.fieldVisibility?.[field.key] ?? 0 // 기본값은 0 (공개)
                        })
                        setFieldVisibility(initialVisibility)
                      }
                      setShowFieldVisibilityModal(true)
                      setShowCollectionMenu(false)
                    }}
                    className="w-full px-5 py-3 text-left text-sm font-medium text-zinc-200 hover:bg-zinc-700/50 flex items-center gap-3"
                  >
                    <Share2 size={18} /> 공유하기
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onOpenCollectionEdit?.()
                      setShowCollectionMenu(false)
                    }}
                    className="w-full px-5 py-3 text-left text-sm font-medium text-zinc-200 hover:bg-zinc-700/50 flex items-center gap-3"
                  >
                    <Edit2 size={18} /> 수정
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setShowShareManageModal(true)
                      setShowCollectionMenu(false)
                    }}
                    className="w-full px-5 py-3 text-left text-sm font-medium text-zinc-200 hover:bg-zinc-700/50 flex items-center gap-3"
                  >
                    <Share2 size={18} /> 공유링크 관리
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onOpenCollectionDelete?.()
                      setShowCollectionMenu(false)
                    }}
                    className="w-full px-5 py-3 text-left text-sm font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                  >
                    <Trash2 size={18} /> 삭제
                  </button>
                </div>,
                document.body
              )}
          </div>
        )}
      </header>

      {/* 에디트 모드 툴바 */}
      {selectedCollection && editMode && (
        <div className="px-10 py-3 bg-zinc-800/50 backdrop-blur border-b border-zinc-700/50 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Table2 size={16} className="text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">에디트 모드</span>
          </div>
          <div className="h-6 w-px bg-zinc-700/50" />
          <button
            ref={addItemButtonRef}
            onClick={() => {
              // 튜토리얼 중이면 실제 기능 실행 안 함
              if (totalItems === 0 && !userProfile?.tutorialCompleted) {
                return
              }
              if (viewMode === 'excel') {
                setDraftNewItem({ id: 'draft-new', name: '', image: '', fields: {} })
              } else {
                onAddItem()
              }
            }}
            className="px-4 py-2 rounded-lg bg-zinc-700/50 hover:bg-zinc-600 text-zinc-200 text-sm font-medium transition-colors flex items-center gap-2"
            title="아이템 추가"
          >
            <Plus size={16} />
            <span>아이템 추가</span>
          </button>
          <button
            ref={fieldManageButtonRef}
            onClick={() => {
              // 튜토리얼 중이면 실제 기능 실행 안 함
              if (totalItems === 0 && !userProfile?.tutorialCompleted) {
                return
              }
              setShowFieldManageModal(true)
            }}
            className="px-4 py-2 rounded-lg bg-zinc-700/50 hover:bg-zinc-600 text-zinc-200 text-sm font-medium transition-colors flex items-center gap-2"
            title="필드 관리"
          >
            <Settings size={16} />
            <span>필드 관리</span>
          </button>
          <div className="h-6 w-px bg-zinc-700/50" />
          <button
            onClick={() => {
              setDeleteMode((prev) => {
                if (prev) {
                  setSelectedItemIds(new Set())
                }
                return !prev
              })
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              deleteMode
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                : 'bg-zinc-700/50 hover:bg-zinc-600 text-zinc-200'
            }`}
            title="삭제 모드"
          >
            <Trash2 size={16} />
            <span>{deleteMode ? '삭제 모드 끄기' : '삭제하기'}</span>
          </button>
          {deleteMode && selectedItemIds.size > 0 && (
            <>
              <div className="h-6 w-px bg-zinc-700/50" />
              <button
                onClick={async () => {
                  if (confirm(`선택한 ${selectedItemIds.size}개의 아이템을 삭제하시겠습니까?`)) {
                    const idsArray = Array.from(selectedItemIds)
                    for (const id of idsArray) {
                      await onDeleteItem(id)
                    }
                    setSelectedItemIds(new Set())
                    setDeleteMode(false)
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                <span>선택 삭제 ({selectedItemIds.size})</span>
              </button>
            </>
          )}
          <div className="flex-1" />
          <div className="text-xs text-zinc-500">
            개별 편집: 아이템을 클릭하여 수정
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8">
        {selectedCollection && (
          <div className="mb-6">
            <div className="border-b border-zinc-600/40 pb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['latest', 'price'].map((key) => (
                  <button
                    key={key}
                    onClick={() => onSortChange(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === key
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                    }`}
                  >
                    {key === 'latest' && '최신순'}
                    {key === 'price' && '가격순'}
                  </button>
                ))}
                <div className="relative ml-2 flex items-center gap-1">
                  {showSearchInput ? (
                    <>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="검색..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') onSearchClear()
                        }}
                        className="w-40 px-3 py-1.5 rounded-lg bg-zinc-700/50 border border-zinc-600 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={onSearchClear}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={onSearchToggle}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
                      title="검색"
                    >
                      <Search size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      filters && Object.keys(filters).some(key => {
                        const val = filters[key]
                        if (Array.isArray(val)) return val.length > 0
                        if (typeof val === 'object' && val !== null) {
                          return Object.values(val).some(v => v !== '' && v != null)
                        }
                        return val !== '' && val != null
                      })
                        ? 'text-cyan-400 bg-cyan-500/20'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                    }`}
                    title="필터"
                  >
                    <Filter size={18} />
                  </button>
                  <button
                    onClick={() => setShowCalculatorModal(true)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
                    title="계산기"
                  >
                    <Calculator size={18} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onViewModeChange('card')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'card'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                  }`}
                  title="카드 모드"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  ref={viewModeButtonRef}
                  onClick={() => {
                    // 튜토리얼 중이면 실제 기능 실행 안 함
                    if (totalItems === 0 && !userProfile?.tutorialCompleted) {
                      return
                    }
                    onViewModeChange('excel')
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'excel'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                  }`}
                  title="엑셀 모드"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className={
            viewMode === 'excel'
              ? ''
              : 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6'
          }
        >
          {!selectedCollection ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
              <Folder size={64} className="opacity-30 mb-5" />
              <h3 className="text-2xl font-bold text-zinc-400 mb-2">
                컬렉션을 선택하거나 새로 만들어보세요
              </h3>
              <p className="text-sm">왼쪽에서 새 컬렉션 추가 버튼을 눌러 시작하세요</p>
            </div>
          ) : viewMode === 'excel' ? (
            <ItemsTable
              items={displayedItems}
              itemFields={currentCollection?.itemFields}
              showEditButtons={editMode}
              deleteMode={deleteMode}
              selectedItemIds={selectedItemIds}
              onToggleSelect={(itemId) => {
                setSelectedItemIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(itemId)) {
                    next.delete(itemId)
                  } else {
                    next.add(itemId)
                  }
                  return next
                })
              }}
              onSelectAll={() => {
                const allIds = displayedItems.map(item => item.id).filter(Boolean)
                setSelectedItemIds(new Set(allIds))
              }}
              onDeselectAll={() => setSelectedItemIds(new Set())}
              onItemClick={!editMode ? (item) => setSelectedItemDetail(item) : undefined}
              draftNewItem={draftNewItem}
              editingItemId={editingItemId}
              editingItemData={editingItemData}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onSaveInline={onSaveInlineItem}
              onCancelInline={() => {
                setDraftNewItem(null)
                setEditingItemId(null)
                setEditingItemData(null)
              }}
              onStartEdit={(item) => {
                setEditingItemId(item?.id ?? null)
                setEditingItemData(item ? { ...item } : null)
              }}
              onUpdateEditItem={(data) => setEditingItemData((prev) => ({ ...prev, ...data }))}
              onDraftChange={setDraftNewItem}
              onUploadImage={onUploadImage}
            />
          ) : (
            <ItemsGrid
              items={displayedItems}
              itemFields={currentCollection?.itemFields}
              showEditButtons={editMode}
              deleteMode={deleteMode}
              selectedItemIds={selectedItemIds}
              onToggleSelect={(itemId) => {
                setSelectedItemIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(itemId)) {
                    next.delete(itemId)
                  } else {
                    next.add(itemId)
                  }
                  return next
                })
              }}
              onSelectAll={() => {
                const allIds = displayedItems.map(item => item.id).filter(Boolean)
                setSelectedItemIds(new Set(allIds))
              }}
              onDeselectAll={() => setSelectedItemIds(new Set())}
              onItemClick={!editMode ? (item) => setSelectedItemDetail(item) : undefined}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          )}
        </div>
      </div>

      {selectedCollection && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative group">
            <button
              ref={editModeButtonRef}
              onClick={() => {
                // 튜토리얼 중이면 실제 기능 실행 안 함 (튜토리얼 오버레이가 처리)
                if (totalItems === 0 && !userProfile?.tutorialCompleted) {
                  // 튜토리얼 중에는 실제 기능 실행 안 함
                  return
                }
                setEditMode((prev) => {
                  if (prev) {
                    setSelectedItemIds(new Set())
                    setDeleteMode(false)
                  }
                  return !prev
                })
              }}
              className={`px-5 py-3 rounded-xl font-semibold backdrop-blur border shadow-lg transition-all flex items-center gap-2 ${
                editMode
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-zinc-700/95 border-zinc-600 text-zinc-100 hover:bg-zinc-600 hover:border-cyan-500/50 hover:-translate-y-0.5'
              }`}
            >
              <Edit2 size={18} />
              <span>{editMode ? '에디트 모드 끄기' : '뷰 모드'}</span>
              <HelpCircle size={14} className="text-zinc-500" />
            </button>
            {/* 툴팁 */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-600 text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
              단축키: Tab 키
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 오버레이 */}
      <TutorialOverlay
        totalItems={totalItems}
        selectedCollection={selectedCollection}
        tutorialCompleted={Boolean(userProfile?.tutorialCompleted)}
        onSetTutorialCompleted={async () => {
          if (!userId) return
          await onUpdateUserProfile?.({ tutorialCompleted: true })
        }}
        editModeButtonRef={editModeButtonRef}
        fieldManageButtonRef={fieldManageButtonRef}
        addItemButtonRef={addItemButtonRef}
        viewModeButtonRef={viewModeButtonRef}
        onToggleEditMode={(value) => {
          // 튜토리얼 중에만 editMode를 강제로 설정
          if (totalItems === 0 && !userProfile?.tutorialCompleted) {
            setEditMode(value)
          }
        }}
        onComplete={() => {
          // 튜토리얼 완료 시 처리
        }}
      />

      {/* 필드 관리 모달 */}
      {showFieldManageModal && selectedCollection && currentCollection && (
        <FieldManageModal
          collection={currentCollection}
          items={items}
          onClose={() => setShowFieldManageModal(false)}
          onSave={async (itemFields) => {
            if (onUpdateCollection) {
              await onUpdateCollection(selectedCollection, { itemFields })
            }
            setShowFieldManageModal(false)
          }}
        />
      )}

      {/* 필터 모달 */}
      {showFilterModal && selectedCollection && currentCollection && (
        <FilterModal
          currentCollection={currentCollection}
          items={currentItems || []}
          filters={filters || {}}
          onClose={() => setShowFilterModal(false)}
          onApply={(newFilters) => {
            onFiltersChange?.(newFilters)
            setShowFilterModal(false)
          }}
        />
      )}

      {/* 계산기 모달 */}
      {showCalculatorModal && selectedCollection && currentCollection && (
        <CalculatorModal
          currentCollection={currentCollection}
          items={displayedItems || []}
          onClose={() => setShowCalculatorModal(false)}
        />
      )}

      {/* 아이템 상세 모달 */}
      {selectedItemDetail && (
        <ItemDetailModal
          item={selectedItemDetail}
          itemFields={currentCollection?.itemFields || []}
          onClose={() => setSelectedItemDetail(null)}
        />
      )}

      {/* 필드 열람 권한 설정 모달 */}
      {showFieldVisibilityModal && selectedCollection && currentCollection && (
        <FieldVisibilityModal
          currentCollection={currentCollection}
          fieldVisibility={fieldVisibility}
          exampleItem={displayedItems?.[0] || currentItems?.[0] || null}
          onClose={() => setShowFieldVisibilityModal(false)}
          onApply={async (visibility) => {
            // 필드 visibility를 원본 컬렉션에 저장
            await onUpdateCollection?.(selectedCollection, {
              fieldVisibility: visibility,
            })
            setFieldVisibility(visibility)
            setShowFieldVisibilityModal(false)
          }}
          onShare={async (visibility) => {
            // 공유하기 실행 (fieldVisibility 포함)
            const result = await onShareCollection?.(visibility)
            setShowFieldVisibilityModal(false)
            if (result?.url) {
              setShareLinkUrl(result.url)
              setShowShareLinkModal(true)
            }
          }}
        />
      )}

      {/* 공유 링크 생성 완료 모달 */}
      {showShareLinkModal && shareLinkUrl && (
        <ShareLinkModal
          url={shareLinkUrl}
          onClose={() => setShowShareLinkModal(false)}
          onManage={() => {
            setShowShareLinkModal(false)
            setShowShareManageModal(true)
          }}
        />
      )}

      {/* 공유링크 관리 모달 */}
      {showShareManageModal && selectedCollection && currentCollection && (
        <ShareManageModal
          selectedCollection={selectedCollection}
          currentCollection={currentCollection}
          displayedItems={displayedItems}
          onClose={() => setShowShareManageModal(false)}
          onUpdateCollection={onUpdateCollection}
          onShareCollection={onShareCollection}
          onNewLinkCreated={(url) => {
            setShareLinkUrl(url)
            setShowShareManageModal(false)
            setShowShareLinkModal(true)
          }}
          onOpenShareSettings={() => {
            setShowShareManageModal(false)
            if (currentCollection?.itemFields) {
              const initialVisibility = {}
              currentCollection.itemFields.forEach(field => {
                initialVisibility[field.key] = currentCollection.fieldVisibility?.[field.key] ?? 0
              })
              setFieldVisibility(initialVisibility)
            }
            setShowFieldVisibilityModal(true)
          }}
        />
      )}
    </>
  )
}

// 공유 링크 생성 완료 모달
function ShareLinkModal({ url, onClose, onManage }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('링크 복사 실패:', e)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[500px] shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">공유링크가 생성되었습니다!</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-2">공유 링크</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors"
              >
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-700/30 border border-zinc-600">
            <p className="text-sm text-zinc-400">
              *공유링크로만 접속가능하며 해당 링크로는 수정및 변경불가능합니다.
            </p>
          </div>

          <button
            onClick={onManage}
            className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 underline transition-colors"
          >
            공유링크 관리 하러가기
          </button>
        </div>

        <div className="px-8 py-6 border-t border-zinc-600/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

// 회원탈퇴 확인 모달
function DeleteAccountModal({ onClose, onConfirm, isDeleting }) {
  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[500px] shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-red-400">회원탈퇴</h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-300 font-semibold mb-2">
              ⚠️ 모든 컬렉션과 아이템들이 삭제됩니다!
            </p>
            <p className="text-sm text-zinc-400">
              회원탈퇴 시 다음 데이터가 영구적으로 삭제됩니다:
            </p>
            <ul className="text-sm text-zinc-400 mt-2 ml-4 list-disc space-y-1">
              <li>모든 개인 컬렉션 및 아이템</li>
              <li>모든 공유 컬렉션 및 아이템</li>
              <li>업로드된 이미지 및 파일</li>
              <li>사용자 프로필 정보</li>
            </ul>
            <p className="text-sm text-zinc-500 mt-3">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>

          <p className="text-lg font-semibold text-zinc-200 text-center">
            정말 삭제하시겠습니까?
          </p>
        </div>

        <div className="px-8 py-6 border-t border-zinc-600/50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-3 rounded-xl bg-zinc-700/50 text-zinc-300 font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {isDeleting ? '탈퇴 중...' : '삭제하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 공유링크 관리 모달
function ShareManageModal({ selectedCollection, currentCollection, displayedItems, onClose, onUpdateCollection, onShareCollection, onNewLinkCreated, onOpenShareSettings }) {
  const [loading, setLoading] = useState(false)
  const shareCollectionId = currentCollection?.shareCollectionId
  const shareUrl = shareCollectionId ? `${window.location.origin}/share/${shareCollectionId}` : null

  const handleDelete = async () => {
    if (!shareCollectionId) return
    if (!confirm('공유 링크를 삭제하시겠습니까? 링크로 접속한 사용자는 더 이상 컬렉션을 볼 수 없습니다.')) {
      return
    }
    setLoading(true)
    try {
      const { unshareCollection } = await import('../data/shareCollection')
      const { auth } = await import('../firebase')
      await unshareCollection(auth.currentUser.uid, shareCollectionId)
      await onUpdateCollection?.(selectedCollection, {
        shareCollectionId: null,
      })
      alert('공유 링크가 삭제되었습니다.')
      onClose()
    } catch (e) {
      alert('공유 링크 삭제 실패: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!confirm('새로운 공유 링크를 발급하시겠습니까? 기존 링크는 더 이상 작동하지 않습니다.')) {
      return
    }
    setLoading(true)
    try {
      // 기존 링크 삭제
      if (shareCollectionId) {
        const { unshareCollection } = await import('../data/shareCollection')
        const { auth } = await import('../firebase')
        await unshareCollection(auth.currentUser.uid, shareCollectionId)
      }
      // 새 링크 생성
      const result = await onShareCollection?.(currentCollection.fieldVisibility || {})
      if (result?.url) {
        onNewLinkCreated?.(result.url)
      }
    } catch (e) {
      alert('공유 링크 재발급 실패: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[600px] shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">공유링크 관리</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {shareUrl ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">현재 활성화된 공유 링크</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl)
                        alert('링크가 복사되었습니다.')
                      } catch (e) {
                        alert('링크 복사 실패')
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors"
                  >
                    복사
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  링크 삭제
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="flex-1 px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                >
                  새로 발급
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 rounded-xl bg-zinc-700/30 border border-zinc-600 text-center">
              <p className="text-zinc-400 mb-4">활성화된 공유 링크가 없습니다.</p>
              <button
                onClick={onOpenShareSettings}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                공유 링크 생성하기
              </button>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-zinc-600/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-zinc-700/50 text-zinc-300 font-medium hover:bg-zinc-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

// 필드 관리 모달 컴포넌트
function FieldManageModal({ collection, items, onClose, onSave }) {
  const [selectedFields, setSelectedFields] = useState(() => {
    const existing = collection?.itemFields || []
    const nonCustom = existing.filter((f) => f.type !== 'custom')
    if (nonCustom.length > 0) {
      return nonCustom.map((f) => {
        const opt = DEFAULT_FIELD_OPTIONS.find((o) => o.key === f.key)
        if (opt) {
          // 기존 필드 설정 유지 또는 기본값 설정
          const result = { ...opt }
          if (f.fieldType) {
            result.fieldType = f.fieldType
            result.options = f.options
            result.inputType = f.inputType
          } else {
            // 기존 필드에 fieldType이 없으면 기본값 설정
            if (f.options || f.key === 'grade' || f.key === 'language') {
              result.fieldType = 'select'
              result.options = f.options || (f.key === 'grade' ? GRADE_OPTIONS : LANGUAGE_OPTIONS)
            } else if (f.type === 'price' || f.type === 'number' || f.type === 'quantity' || f.type === 'marketPrice') {
              result.fieldType = 'input'
              result.inputType = 'int'
            } else {
              result.fieldType = 'input'
              result.inputType = 'str'
            }
          }
          return result
        }
        return f
      })
    }
    return DEFAULT_FIELD_OPTIONS.filter((opt) => !opt.disabled).map(opt => {
      const result = { ...opt }
      if (opt.key === 'grade' || opt.key === 'language') {
        result.fieldType = 'select'
        result.options = opt.key === 'grade' ? [...GRADE_OPTIONS] : [...LANGUAGE_OPTIONS]
      } else if (opt.type === 'price' || opt.type === 'number' || opt.type === 'quantity' || opt.type === 'marketPrice') {
        result.fieldType = 'input'
        result.inputType = 'int'
      } else {
        result.fieldType = 'input'
        result.inputType = 'str'
      }
      return result
    })
  })
  const [customFields, setCustomFields] = useState(() => {
    const existing = collection?.itemFields || []
    return existing.filter((f) => f.type === 'custom').map(f => {
      // 기존 커스텀 필드에 fieldType이 없으면 기본값 설정
      if (!f.fieldType) {
        return {
          ...f,
          fieldType: f.options ? 'select' : 'input',
          inputType: f.inputType || 'str'
        }
      }
      return f
    })
  })
  const [customFieldInput, setCustomFieldInput] = useState('')
  const [editingFieldOptions, setEditingFieldOptions] = useState(null) // { fieldKey, newOption }
  const [showFieldEditModal, setShowFieldEditModal] = useState(null) // fieldKey or null

  const toggleField = (opt) => {
    if (opt.disabled) return
    setSelectedFields((prev) => {
      if (prev.some((f) => f.key === opt.key)) {
        return prev.filter((f) => f.key !== opt.key)
      } else {
        // 필드 추가 시 기본 설정
        const newField = { ...opt }
        // 기존 타입에 따라 기본값 설정
        if (opt.key === 'grade' || opt.key === 'language') {
          newField.fieldType = 'select'
          newField.options = opt.key === 'grade' ? [...GRADE_OPTIONS] : [...LANGUAGE_OPTIONS]
        } else if (opt.type === 'price' || opt.type === 'number' || opt.type === 'quantity' || opt.type === 'marketPrice') {
          newField.fieldType = 'input'
          newField.inputType = 'int'
        } else {
          newField.fieldType = 'input'
          newField.inputType = 'str'
        }
        return [...prev, newField]
      }
    })
  }

  // 필드 타입 변경
  const updateFieldType = (fieldKey, fieldType, inputType = null) => {
    setSelectedFields((prev) =>
      prev.map((f) => {
        if (f.key === fieldKey) {
          const updated = { ...f, fieldType }
          if (fieldType === 'select') {
            // 셀렉트박스로 변경 시 기존 options 유지 또는 빈 배열
            updated.options = f.options || []
            delete updated.inputType
          } else if (fieldType === 'input') {
            // 입력박스로 변경 시 inputType 설정
            updated.inputType = inputType || 'str'
            delete updated.options
          }
          return updated
        }
        return f
      })
    )
  }

  // 필드 옵션 추가
  const addFieldOption = (fieldKey, optionValue) => {
    if (!optionValue.trim()) return
    setSelectedFields((prev) =>
      prev.map((f) => {
        if (f.key === fieldKey && f.options) {
          const trimmed = optionValue.trim()
          if (f.options.includes(trimmed)) return f
          return { ...f, options: [...f.options, trimmed] }
        }
        return f
      })
    )
    setEditingFieldOptions(null)
  }

  // 필드 옵션 삭제
  const removeFieldOption = (fieldKey, optionValue) => {
    setSelectedFields((prev) =>
      prev.map((f) => {
        if (f.key === fieldKey && f.options) {
          return { ...f, options: f.options.filter((o) => o !== optionValue) }
        }
        return f
      })
    )
  }

  const addCustomField = () => {
    const label = customFieldInput.trim()
    if (!label || customFields.some((f) => f.label === label)) return
    setCustomFields((prev) => [...prev, { 
      type: 'custom', 
      key: `custom_${Date.now()}`, 
      label,
      fieldType: 'input',
      inputType: 'str'
    }])
    setCustomFieldInput('')
  }
  
  // 커스텀 필드 타입 변경
  const updateCustomFieldType = (fieldKey, fieldType, inputType = null) => {
    setCustomFields((prev) =>
      prev.map((f) => {
        if (f.key === fieldKey) {
          const updated = { ...f, fieldType }
          if (fieldType === 'select') {
            updated.options = f.options || []
            delete updated.inputType
          } else if (fieldType === 'input') {
            updated.inputType = inputType || 'str'
            delete updated.options
          }
          return updated
        }
        return f
      })
    )
  }
  
  // 커스텀 필드 옵션 추가
  const addCustomFieldOption = (fieldKey, optionValue) => {
    if (!optionValue.trim()) return
    setCustomFields((prev) =>
      prev.map((f) => {
        if (f.key === fieldKey && f.options) {
          const trimmed = optionValue.trim()
          if (f.options.includes(trimmed)) return f
          return { ...f, options: [...f.options, trimmed] }
        }
        return f
      })
    )
    setEditingFieldOptions(null)
  }
  
  // 커스텀 필드 옵션 삭제
  const removeCustomFieldOption = (fieldKey, optionValue) => {
    setCustomFields((prev) =>
      prev.map((f) => {
        if (f.key === fieldKey && f.options) {
          return { ...f, options: f.options.filter((o) => o !== optionValue) }
        }
        return f
      })
    )
  }

  const removeCustomField = (key) => {
    setCustomFields((prev) => prev.filter((f) => f.key !== key))
  }

  const handleSave = () => {
    const itemFields = [...selectedFields, ...customFields]
    
    const oldKeys = new Set((collection?.itemFields || []).map((f) => f.key))
    const newKeys = new Set(itemFields.map((f) => f.key))
    const removedKeys = [...oldKeys].filter((k) => !newKeys.has(k))

    const fieldsWithData = []
    if (removedKeys.length > 0) {
      const collectionItemIds = collection?.items || []
      for (const key of removedKeys) {
        const hasData = collectionItemIds.some((itemId) => {
          const item = items?.[itemId]
          const val = item?.fields?.[key]
          return val !== undefined && val !== null && String(val).trim() !== ''
        })
        if (hasData) {
          const field = (collection?.itemFields || []).find((f) => f.key === key)
          fieldsWithData.push(field?.label || key)
        }
      }
    }

    if (fieldsWithData.length > 0) {
      const msg = fieldsWithData.map((l) => `"${l}"`).join(', ')
      if (!confirm(`${msg} 필드의 정보들이 모두 지워집니다. 계속하시겠습니까?`)) {
        return
      }
    }

    onSave(itemFields)
  }

  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">필드 관리</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* 기본 필드 */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">기본 필드</h3>
            <div className="grid grid-cols-2 gap-3">
              {DEFAULT_FIELD_OPTIONS.map((opt) => {
                const isSelected = selectedFields.some((f) => f.key === opt.key)
                const selectedField = selectedFields.find((f) => f.key === opt.key)
                return (
                  <div
                    key={opt.key}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500'
                        : opt.disabled
                        ? 'bg-zinc-700/30 border-zinc-700'
                        : 'bg-zinc-700/50 border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleField(opt)}
                        disabled={opt.disabled}
                        className={`flex-1 text-left ${
                          isSelected
                            ? 'text-cyan-400'
                            : opt.disabled
                            ? 'text-zinc-600 cursor-not-allowed'
                            : 'text-zinc-300 hover:text-zinc-100'
                        }`}
                      >
                        <span className="font-medium">{opt.label}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        {isSelected && <Check size={18} className="text-cyan-400" />}
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowFieldEditModal(opt.key)
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            title="필드 편집"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 수동 필드 추가 */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">수동 필드 추가</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customFieldInput}
                onChange={(e) => setCustomFieldInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomField()
                  }
                }}
                placeholder="필드 이름을 입력하세요"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={addCustomField}
                className="px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                추가
              </button>
            </div>
            {customFields.length > 0 && (
              <div className="space-y-2">
                {customFields.map((field) => (
                  <div
                    key={field.key}
                    className="px-4 py-3 rounded-xl bg-zinc-700/50 border border-zinc-600 flex items-center justify-between"
                  >
                    <span className="text-zinc-200 font-medium">{field.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowFieldEditModal(field.key)
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                        title="필드 편집"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => removeCustomField(field.key)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-zinc-600/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-zinc-700/50 text-zinc-300 font-medium hover:bg-zinc-600 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            저장
          </button>
        </div>
      </div>

      {/* 필드 편집 모달 */}
      {showFieldEditModal && (() => {
        // 기본 필드 또는 커스텀 필드 찾기
        const field = selectedFields.find((f) => f.key === showFieldEditModal) || 
                      customFields.find((f) => f.key === showFieldEditModal)
        if (!field) return null
        
        const isCustomField = field.type === 'custom'
        
        const currentFieldType = field.fieldType || (field.options ? 'select' : 'input')
        const currentInputType = field.inputType || 'str'
        const fieldOptions = field.options || []
        
        return (
          <div
            className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-[1100]"
            onClick={() => setShowFieldEditModal(null)}
          >
            <div
              className="bg-zinc-800 rounded-2xl w-[90%] max-w-[500px] max-h-[80vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-100">{field.label} 필드 편집</h2>
                <button
                  onClick={() => setShowFieldEditModal(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-6">
                {/* 필드 타입 선택 */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">필드 성질</h3>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCustomField) {
                          updateCustomFieldType(field.key, 'select')
                        } else {
                          updateFieldType(field.key, 'select')
                        }
                      }}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                        currentFieldType === 'select'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="font-medium">셀렉트박스</div>
                      <div className="text-xs text-zinc-400 mt-1">옵션 선택</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isCustomField) {
                          updateCustomFieldType(field.key, 'input', currentInputType)
                        } else {
                          updateFieldType(field.key, 'input', currentInputType)
                        }
                      }}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                        currentFieldType === 'input'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="font-medium">입력박스</div>
                      <div className="text-xs text-zinc-400 mt-1">직접 입력</div>
                    </button>
                  </div>
                </div>

                {/* 셀렉트박스 옵션 관리 */}
                {currentFieldType === 'select' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-zinc-300">옵션 목록</h3>
                      <button
                        type="button"
                        onClick={() => setEditingFieldOptions({ fieldKey: field.key, newOption: '' })}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} />
                        추가
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {fieldOptions.map((option) => (
                        <div
                          key={option}
                          className="px-3 py-1.5 rounded-lg bg-zinc-600/50 border border-zinc-500/50 flex items-center gap-2"
                        >
                          <span className="text-zinc-200 text-sm">{option}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isCustomField) {
                                removeCustomFieldOption(field.key, option)
                              } else {
                                removeFieldOption(field.key, option)
                              }
                            }}
                            className="p-0.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {editingFieldOptions?.fieldKey === field.key && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingFieldOptions.newOption}
                          onChange={(e) =>
                            setEditingFieldOptions({ ...editingFieldOptions, newOption: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              if (isCustomField) {
                                addCustomFieldOption(field.key, editingFieldOptions.newOption)
                              } else {
                                addFieldOption(field.key, editingFieldOptions.newOption)
                              }
                            } else if (e.key === 'Escape') {
                              setEditingFieldOptions(null)
                            }
                          }}
                          placeholder="새 옵션 입력"
                          autoFocus
                          className="flex-1 px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (isCustomField) {
                              addCustomFieldOption(field.key, editingFieldOptions.newOption)
                            } else {
                              addFieldOption(field.key, editingFieldOptions.newOption)
                            }
                          }}
                          className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
                        >
                          확인
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFieldOptions(null)}
                          className="px-4 py-2 rounded-lg bg-zinc-700/50 border border-zinc-600 text-zinc-300 text-sm font-medium hover:bg-zinc-600 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 입력박스 타입 선택 */}
                {currentFieldType === 'input' && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-300 mb-3">입력 성질</h3>
                    <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCustomField) {
                          updateCustomFieldType(field.key, 'input', 'int')
                        } else {
                          updateFieldType(field.key, 'input', 'int')
                        }
                      }}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                        currentInputType === 'int'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="font-medium">int (정수)</div>
                      <div className="text-xs text-zinc-400 mt-1">숫자만 입력</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isCustomField) {
                          updateCustomFieldType(field.key, 'input', 'str')
                        } else {
                          updateFieldType(field.key, 'input', 'str')
                        }
                      }}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                        currentInputType === 'str'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="font-medium">str (텍스트)</div>
                      <div className="text-xs text-zinc-400 mt-1">텍스트/숫자 입력</div>
                    </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 border-t border-zinc-600/50 flex justify-end">
                <button
                  onClick={() => setShowFieldEditModal(null)}
                  className="px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors"
                >
                  완료
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

const iconMap = {
  folder: Folder,
  'credit-card': CreditCard,
  image: Image,
  package: Package,
}

function ItemImageDisplay({ value }) {
  if (!value) return <div className="w-12 h-12 rounded bg-zinc-700/50" />
  if (value.startsWith('icon:')) {
    const iconId = value.replace('icon:', '')
    const Icon = iconMap[iconId] || Image
    return (
      <div className="w-12 h-12 rounded bg-zinc-700/50 flex items-center justify-center">
        <Icon size={24} className="text-zinc-400" />
      </div>
    )
  }
  return <img src={value} alt="" className="w-12 h-12 object-cover rounded" />
}

function ImageEditButton({ value, onChange, onUploadImage }) {
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('icon') // 'icon' | 'link' | 'upload'
  const [linkInput, setLinkInput] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (showModal) {
      setLinkInput(value?.startsWith('icon:') ? '' : value || '')
    }
  }, [showModal, value])

  const handleIconSelect = (iconId) => {
    onChange(`icon:${iconId}`)
    setShowModal(false)
  }

  const handleLinkApply = () => {
    onChange(linkInput.trim())
    setShowModal(false)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadImage) return
    setUploading(true)
    try {
      const url = await onUploadImage(file)
      onChange(url)
      setShowModal(false)
    } catch (err) {
      console.error(err)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-12 h-12 rounded bg-zinc-700/50 flex items-center justify-center text-zinc-400 hover:bg-zinc-600 hover:text-cyan-400 transition-colors border border-dashed border-zinc-600 hover:border-cyan-500/50"
      >
        <Pencil size={20} />
      </button>
      {showModal && (
        <div
          className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1100]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-zinc-800 rounded-2xl w-[90%] max-w-[400px] p-6 shadow-2xl border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-zinc-100 mb-4">이미지 설정</h3>
            <div className="flex gap-2 mb-4">
              {[
                { id: 'icon', label: '아이콘' },
                { id: 'link', label: '이미지 링크' },
                { id: 'upload', label: '이미지 첨부' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === m.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/50 text-zinc-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {mode === 'icon' && (
              <div className="flex gap-2 flex-wrap">
                {THUMBNAIL_ICONS.map((ic) => {
                  const Icon = iconMap[ic.id] || Image
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => handleIconSelect(ic.id)}
                      className="p-3 rounded-xl border-2 border-zinc-600 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors"
                    >
                      <Icon size={28} className="text-zinc-300" />
                    </button>
                  )
                })}
              </div>
            )}
            {mode === 'link' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="이미지 URL 입력"
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleLinkApply}
                  className="w-full py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-medium hover:bg-cyan-500/30"
                >
                  적용
                </button>
              </div>
            )}
            {mode === 'upload' && (
              onUploadImage ? (
                <label className="block w-full py-8 rounded-xl border-2 border-dashed border-zinc-600 hover:border-cyan-500/50 cursor-pointer bg-zinc-700/30 hover:bg-zinc-700/50 transition-colors">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <Upload size={32} />
                    <span>{uploading ? '업로드 중...' : '클릭하여 이미지 선택'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileSelect}
                  />
                </label>
              ) : (
                <p className="py-4 text-center text-zinc-500 text-sm">로그인 후 이미지 첨부가 가능합니다</p>
              )
            )}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-4 w-full py-2 rounded-xl bg-zinc-600/50 text-zinc-400 hover:bg-zinc-600"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ItemsTable({
  items,
  itemFields,
  showEditButtons,
  deleteMode,
  selectedItemIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onItemClick,
  draftNewItem,
  editingItemId,
  editingItemData,
  onEdit,
  onDelete,
  onSaveInline,
  onCancelInline,
  onStartEdit,
  onUpdateEditItem,
  onDraftChange,
  onUploadImage,
}) {
  const allKeys = new Set()
  const baseItems = (items || []).map((i) =>
    i?.id === editingItemId && editingItemData ? editingItemData : i
  )
  // draftNewItem이 있으면 항상 포함, 아이템이 없어도 표시되도록
  const allItems = draftNewItem ? [...baseItems, draftNewItem] : baseItems
  
  // 아이템이 없을 때도 필드 키를 수집할 수 있도록 draftNewItem의 필드도 포함
  allItems.forEach((i) =>
    Object.keys(i?.fields || {}).forEach((k) => allKeys.add(k))
  )
  ;(itemFields || []).forEach((f) => allKeys.add(f.key))
  const keys = [...allKeys]
  const labelMap = (itemFields || []).reduce((acc, f) => ({ ...acc, [f.key]: f.label }), {})
  const fieldTypeMap = (itemFields || []).reduce((acc, f) => ({ ...acc, [f.key]: f.type }), {})
  const gridCols = deleteMode
    ? `minmax(2rem,auto) minmax(3rem,auto) minmax(3rem,auto) 1fr ${keys.map(() => 'minmax(5rem,1fr)').join(' ')}`
    : `minmax(3rem,auto) minmax(3rem,auto) 1fr ${keys.map(() => 'minmax(5rem,1fr)').join(' ')}`

  const isEditing = (item) =>
    (draftNewItem && item?.id === 'draft-new') || editingItemId === item?.id

  const updateItemData = (item, updates) => {
    if (draftNewItem && item?.id === 'draft-new') {
      onDraftChange({ ...draftNewItem, ...updates })
    } else if (editingItemId === item?.id && onUpdateEditItem) {
      onUpdateEditItem(updates)
    }
  }

  const handleSave = async (item) => {
    if (!onSaveInline) return
    const isNew = draftNewItem && item?.id === 'draft-new'
    const data = {
      name: item.name || '',
      image: item.image || '',
      fields: item.fields || {},
    }
    if (!isNew) data.id = item.id
    if (!data.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }
    await onSaveInline(data, isNew)
    onCancelInline()
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-700/50 w-full">
      <div className="inline-block min-w-full">
        <div
          className="grid border-b border-zinc-700/50"
          style={{ gridTemplateColumns: gridCols, minWidth: 'max-content' }}
        >
          {deleteMode && (
            <div 
              className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                const allRealItems = allItems.filter(i => i?.id && !i?.id.startsWith('draft-'))
                const allSelected = allRealItems.length > 0 && allRealItems.every(i => selectedItemIds?.has(i.id))
                if (allSelected) {
                  onDeselectAll?.()
                } else {
                  onSelectAll?.()
                }
              }}
            >
              <input
                type="checkbox"
                checked={allItems.filter(i => i?.id && !i?.id.startsWith('draft-')).length > 0 && 
                  allItems.filter(i => i?.id && !i?.id.startsWith('draft-')).every(i => selectedItemIds?.has(i.id))}
                onChange={() => {}}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer pointer-events-none"
              />
            </div>
          )}
          <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">
            번호
          </div>
          <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">
            이미지
          </div>
          <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">
            이름
          </div>
          {keys.map((k) => (
            <div key={k} className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">
              {labelMap[k] || k}
            </div>
          ))}
        </div>
        {allItems.length === 0 && !draftNewItem ? (
          <div className="px-4 py-8 text-center text-zinc-500">
            아이템이 없습니다. 에디트 모드에서 아이템 추가 버튼을 눌러 추가하세요.
          </div>
        ) : (
          allItems.map((item, index) => {
            const editing = isEditing(item)
            const isDraft = draftNewItem && item?.id === 'draft-new'
            return (
              <div key={item?.id ?? index}>
                <div
                  onClick={() => {
                    if (showEditButtons && !editing && !isDraft) {
                      onStartEdit(item)
                    } else if (!showEditButtons && !editing && !isDraft && onItemClick) {
                      onItemClick(item)
                    }
                  }}
                  className={`grid relative border-b border-zinc-700/30 transition-all ${
                    editing
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : showEditButtons || onItemClick
                        ? 'cursor-pointer hover:bg-zinc-700/30 hover:border-cyan-500/20'
                        : 'hover:bg-zinc-700/30'
                  }`}
                  style={{ gridTemplateColumns: gridCols, minWidth: 'max-content' }}
                >
                  {deleteMode && !isDraft && (
                    <div 
                      className="px-4 py-3 flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (item?.id) onToggleSelect?.(item.id)
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds?.has(item?.id)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer pointer-events-none"
                      />
                    </div>
                  )}
                  {deleteMode && isDraft && <div />}
                  <div className="px-4 py-3 text-zinc-400 font-medium">
                    {index + 1}
                  </div>
                  <div className="px-4 py-3">
                    {editing ? (
                      <ImageEditButton
                        value={item.image || ''}
                        onChange={(val) => updateItemData(item, { image: val })}
                        onUploadImage={onUploadImage}
                      />
                    ) : (
                      <ItemImageDisplay value={item.image} />
                    )}
                  </div>
                  <div className="px-4 py-3">
                    {editing ? (
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => updateItemData(item, { name: e.target.value })}
                        placeholder="이름"
                        className="w-full px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 font-medium placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                    ) : (
                      <span className="font-medium text-zinc-100">{item.name || '-'}</span>
                    )}
                  </div>
                  {keys.map((k) => {
                    const field = itemFields?.find(f => f.key === k)
                    const fieldType = field?.fieldType || (field?.options ? 'select' : 'input')
                    const inputType = field?.inputType || 'str'
                    return (
                      <div key={k} className="px-4 py-3">
                        {editing ? (
                          <InlineFieldInput
                            fieldKey={k}
                            fieldType={fieldTypeMap[k] || 'text'}
                            value={item.fields?.[k]}
                            options={field?.options}
                            fieldTypeConfig={fieldType}
                            inputType={inputType}
                            onChange={(val) =>
                              updateItemData(item, {
                                fields: { ...(item.fields || {}), [k]: val },
                              })
                            }
                          />
                        ) : (
                          <FieldValue fieldKey={k} value={item.fields?.[k]} />
                        )}
                      </div>
                    )
                  })}
                </div>
                {editing && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border-b border-zinc-700/30">
                    <button
                      onClick={() => handleSave(item)}
                      className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                    >
                      <Check size={16} /> 완료
                    </button>
                    <button
                      onClick={onCancelInline}
                      className="px-4 py-2 rounded-lg bg-zinc-600/50 text-zinc-400 font-medium hover:bg-zinc-600 transition-colors"
                    >
                      취소
                    </button>
                    {!isDraft && onDelete && (
                      <button
                        onClick={() => {
                          if (confirm('이 아이템을 삭제하시겠습니까?')) {
                            onDelete(item.id)
                            onCancelInline()
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors ml-auto"
                      >
                        <Trash2 size={16} /> 삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function InlineFieldInput({ fieldKey, fieldType, value, onChange, items, options, fieldTypeConfig, inputType }) {
  const val = value ?? ''
  
  // 시리즈 필드의 경우 최근 입력값 수집
  const getRecentSeries = () => {
    if (fieldType !== 'series') return []
    
    // localStorage에서 최근 입력값 가져오기
    const stored = localStorage.getItem('recentSeries')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    return []
  }
  
  const saveRecentSeries = (seriesValue) => {
    if (!seriesValue || fieldType !== 'series') return
    const recent = getRecentSeries()
    const updated = [seriesValue, ...recent.filter(s => s !== seriesValue)].slice(0, 10) // 최대 10개
    localStorage.setItem('recentSeries', JSON.stringify(updated))
  }
  
  // fieldTypeConfig가 있으면 커스텀 설정 사용
  if (fieldTypeConfig === 'select' && options && options.length > 0) {
    return (
      <select
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
      >
        <option value="">선택</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }
  
  if (fieldTypeConfig === 'input') {
    if (inputType === 'int') {
      return (
        <input
          type="number"
          min={0}
          step={1}
          value={val}
          onChange={(e) => onChange(e.target.value)}
          placeholder="정수 입력"
          className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
        />
      )
    } else {
      return (
        <input
          type="text"
          value={val}
          onChange={(e) => onChange(e.target.value)}
          placeholder="텍스트 입력"
          className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
        />
      )
    }
  }
  
  if (fieldType === 'grade') {
    const [gradeOrg = '', gradeNum = ''] = String(val).split(/\s+/)
    const gradeOptions = options || GRADE_OPTIONS
    return (
      <div className="flex gap-1">
        <select
          value={gradeOrg}
          onChange={(e) =>
            onChange(`${e.target.value} ${gradeNum}`.trim())
          }
          className="flex-1 min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">선택</option>
          {gradeOptions.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select
          value={gradeNum}
          onChange={(e) =>
            onChange(`${gradeOrg} ${e.target.value}`.trim())
          }
          className="flex-1 min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">선택</option>
          {GRADE_NUMBERS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    )
  }
  if (fieldType === 'price') {
    return (
      <input
        type="number"
        min={0}
        value={val}
        onChange={(e) => onChange(e.target.value)}
        placeholder="숫자"
        className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
      />
    )
  }
  if (fieldType === 'purchaseDate') {
    return (
      <input
        type="date"
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
      />
    )
  }
  if (fieldType === 'language') {
    const languageOptions = options || LANGUAGE_OPTIONS
    return (
      <select
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
      >
        <option value="">선택</option>
        {languageOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }
  if (fieldType === 'memo') {
    return (
      <input
        type="text"
        value={val}
        onChange={(e) => onChange(e.target.value.slice(0, 50))}
        placeholder="50자까지"
        maxLength={50}
        className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
      />
    )
  }
  if (fieldType === 'series') {
    const recentSeries = getRecentSeries()
    const listId = `series-list-${fieldKey}`
    return (
      <>
        <input
          type="text"
          list={listId}
          value={val}
          onChange={(e) => {
            onChange(e.target.value)
            if (e.target.value.trim()) {
              saveRecentSeries(e.target.value.trim())
            }
          }}
          onBlur={(e) => {
            if (e.target.value.trim()) {
              saveRecentSeries(e.target.value.trim())
            }
          }}
          placeholder="시리즈 입력"
          className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
        />
        <datalist id={listId}>
          {recentSeries.map((series, idx) => (
            <option key={idx} value={series} />
          ))}
        </datalist>
      </>
    )
  }
  return (
    <input
      type="text"
      value={val}
      onChange={(e) => onChange(e.target.value)}
      placeholder="값 입력"
      className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
    />
  )
}

function FieldValue({ fieldKey, value }) {
  const str = String(value || '')
  const isPurchasePlace = fieldKey === 'purchasePlace' || fieldKey === '구매장소'
  const [copied, setCopied] = useState(false)
  const display = isPurchasePlace && str.length > 10 ? str.slice(0, 10) + '...' : str
  const handleCopy = () => {
    if (!str) return
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  if (isPurchasePlace && str) {
    return (
      <span
        onClick={handleCopy}
        className="cursor-pointer hover:text-cyan-400 transition-colors relative"
        title="클릭하여 복사"
      >
        {display}
        {copied && (
          <span className="absolute -top-6 left-0 px-2 py-1 rounded bg-cyan-500/90 text-white text-xs whitespace-nowrap">
            복사됨
          </span>
        )}
      </span>
    )
  }
  return <span>{display || '-'}</span>
}

function ItemsGrid({ items, itemFields, showEditButtons, deleteMode, selectedItemIds, onToggleSelect, onSelectAll, onDeselectAll, onItemClick, onEdit, onDelete }) {
  const labelMap = (itemFields || []).reduce((acc, f) => ({ ...acc, [f.key]: f.label }), {})
  return items.map((item) => (
    <div
      key={item.id}
      onClick={() => {
        if (!showEditButtons && !deleteMode && onItemClick) {
          onItemClick(item)
        }
      }}
      className="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-lg hover:shadow-zinc-900/50 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative"
    >
      {deleteMode && (
        <div 
          className="absolute top-2 left-2 z-10 bg-zinc-900/80 rounded p-2 cursor-pointer hover:bg-zinc-800 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            if (item?.id) onToggleSelect?.(item.id)
          }}
        >
          <input
            type="checkbox"
            checked={selectedItemIds?.has(item?.id)}
            onChange={() => {}}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-cyan-500 focus:ring-cyan-500 focus:ring-2 cursor-pointer pointer-events-none"
          />
        </div>
      )}
      <img
        src={item.image || ''}
        alt={item.name}
        className="w-full h-60 object-cover bg-gradient-to-br from-zinc-700 to-zinc-800"
      />
      <div className="p-5">
        <div className="text-xl font-bold text-zinc-100 mb-3">{item.name}</div>
        <div className="flex flex-col gap-2">
          {/* itemFields 순서대로 필드 표시 */}
          {(itemFields || [])
            .filter(f => item.fields?.[f.key] !== undefined && item.fields?.[f.key] !== null && item.fields?.[f.key] !== '')
            .map((field) => (
              <div
                key={field.key}
                className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-700/50 last:border-0"
              >
                <span className="text-zinc-400 font-semibold">{field.label || field.key}</span>
                <span className="text-zinc-200 font-medium">
                  <FieldValue fieldKey={field.key} value={item.fields[field.key]} />
                </span>
              </div>
            ))}
        </div>
        {showEditButtons && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
            <button
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-700/50 text-zinc-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-600 transition-colors"
              onClick={() => onEdit(item)}
            >
              <Edit2 size={14} /> 수정
            </button>
            <button
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-700/50 text-zinc-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  ))
}

// 필터 모달 컴포넌트
function FilterModal({ currentCollection, items, filters, onClose, onApply }) {
  const [localFilters, setLocalFilters] = useState(() => ({
    gradeType: filters?.gradeType || '',
    gradeNumber: filters?.gradeNumber || '',
    priceMin: filters?.priceMin || '',
    priceMax: filters?.priceMax || '',
    language: filters?.language || [],
    purchaseDateStart: filters?.purchaseDateStart || '',
    purchaseDateEnd: filters?.purchaseDateEnd || '',
    series: filters?.series || [],
  }))

  const itemFields = currentCollection?.itemFields || []
  const hasGrade = itemFields.some(f => f.key === 'grade')
  const hasPrice = itemFields.some(f => f.key === 'price')
  const hasLanguage = itemFields.some(f => f.key === 'language')
  const hasPurchaseDate = itemFields.some(f => f.key === 'purchaseDate')
  const hasSeries = itemFields.some(f => f.key === 'series')
  
  // 현재 컬렉션의 모든 시리즈 값 수집 (중복 제거)
  const availableSeries = Array.from(
    new Set(
      (items || [])
        .map(item => {
          const seriesValue = item.fields?.series || item.fields?.['시리즈'] || ''
          return String(seriesValue).trim()
        })
        .filter(s => s !== '')
    )
  ).sort()

  const selectGradeType = (type) => {
    setLocalFilters(prev => ({
      ...prev,
      gradeType: prev.gradeType === type ? '' : type
    }))
  }

  const selectGradeNumber = (number) => {
    setLocalFilters(prev => ({
      ...prev,
      gradeNumber: prev.gradeNumber === number ? '' : number
    }))
  }

  const toggleLanguage = (lang) => {
    setLocalFilters(prev => ({
      ...prev,
      language: prev.language.includes(lang)
        ? prev.language.filter(l => l !== lang)
        : [...prev.language, lang]
    }))
  }

  const toggleSeries = (series) => {
    setLocalFilters(prev => ({
      ...prev,
      series: prev.series.includes(series)
        ? prev.series.filter(s => s !== series)
        : [...prev.series, series]
    }))
  }

  const clearFilters = () => {
    setLocalFilters({
      gradeType: '',
      gradeNumber: '',
      priceMin: '',
      priceMax: '',
      language: [],
      purchaseDateStart: '',
      purchaseDateEnd: '',
      series: [],
    })
  }

  const hasActiveFilters = () => {
    return localFilters.gradeType !== '' ||
      (localFilters.gradeType !== '' && localFilters.gradeNumber !== '') ||
      localFilters.priceMin !== '' ||
      localFilters.priceMax !== '' ||
      localFilters.language.length > 0 ||
      localFilters.purchaseDateStart !== '' ||
      localFilters.purchaseDateEnd !== '' ||
      localFilters.series.length > 0
  }

  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">필터</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* 등급 필터 */}
          {hasGrade && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">등급</h3>
              <div className="space-y-4">
                {/* 등급 타입 선택 */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">등급 타입 (전체 선택 가능)</h4>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_OPTIONS.map((type) => {
                      const isSelected = localFilters.gradeType === type
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => selectGradeType(type)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                              : 'bg-zinc-700/50 border-2 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                          }`}
                        >
                          {type}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* 등급 숫자 선택 (선택사항) */}
                {localFilters.gradeType && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-2">등급 숫자 (선택 안 하면 전체)</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => selectGradeNumber('')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          localFilters.gradeNumber === ''
                            ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                            : 'bg-zinc-700/50 border-2 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                        }`}
                      >
                        전체
                      </button>
                      {GRADE_NUMBERS.map((num) => {
                        const isSelected = localFilters.gradeNumber === num.toString()
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => selectGradeNumber(num.toString())}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                                : 'bg-zinc-700/50 border-2 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                            }`}
                          >
                            {num}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 가격 범위 필터 */}
          {hasPrice && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">가격 범위</h3>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={localFilters.priceMin}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  placeholder="최소 가격"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-zinc-400">~</span>
                <input
                  type="number"
                  value={localFilters.priceMax}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  placeholder="최대 가격"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* 언어 필터 */}
          {hasLanguage && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">언어</h3>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = localFilters.language.includes(lang)
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-zinc-700/50 border border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {lang}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 구매기간 필터 */}
          {hasPurchaseDate && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">구매기간</h3>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={localFilters.purchaseDateStart}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, purchaseDateStart: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-zinc-400">~</span>
                <input
                  type="date"
                  value={localFilters.purchaseDateEnd}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, purchaseDateEnd: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* 시리즈 필터 */}
          {hasSeries && availableSeries.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">시리즈</h3>
              <div className="flex flex-wrap gap-2">
                {availableSeries.map((series) => {
                  const isSelected = localFilters.series.includes(series)
                  return (
                    <button
                      key={series}
                      type="button"
                      onClick={() => toggleSeries(series)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-zinc-700/50 border border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {series}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-zinc-600/50 flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="px-6 py-3 rounded-xl bg-zinc-700/50 text-zinc-300 font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasActiveFilters()}
          >
            필터 초기화
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-zinc-700/50 text-zinc-300 font-medium hover:bg-zinc-600 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => onApply(localFilters)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 계산기 모달 컴포넌트
function CalculatorModal({ currentCollection, items, onClose }) {
  const itemFields = currentCollection?.itemFields || []
  
  // int 타입 필드만 필터링
  const intFields = itemFields.filter(f => {
    if (f.fieldType === 'input' && f.inputType === 'int') return true
    // 기존 필드 타입 체크 (price, quantity, marketPrice 등)
    if (f.type === 'price' || f.type === 'number' || f.type === 'quantity' || f.type === 'marketPrice') return true
    return false
  })
  
  const [selectedFields, setSelectedFields] = useState([])
  
  const toggleField = (fieldKey) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(k => k !== fieldKey)
        : [...prev, fieldKey]
    )
  }
  
  // 선택된 필드들의 합계 계산
  const calculateTotals = () => {
    const totals = {}
    selectedFields.forEach(fieldKey => {
      let sum = 0
      items.forEach(item => {
        const value = item.fields?.[fieldKey]
        if (value !== undefined && value !== null && value !== '') {
          const num = parseInt(String(value).replace(/[^\d]/g, ''), 10)
          if (!isNaN(num)) {
            sum += num
          }
        }
      })
      totals[fieldKey] = sum
    })
    return totals
  }
  
  const totals = calculateTotals()
  const totalCount = items.length
  
  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">계산기</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* 계산 대상 아이템 수 */}
          <div className="p-4 rounded-xl bg-zinc-700/30 border border-zinc-600">
            <div className="text-sm text-zinc-400 mb-1">계산 대상 아이템</div>
            <div className="text-2xl font-bold text-cyan-400">{totalCount.toLocaleString()}개</div>
          </div>

          {/* 계산할 필드 선택 */}
          {intFields.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">계산할 필드 선택</h3>
              <div className="space-y-2">
                {intFields.map((field) => {
                  const isSelected = selectedFields.includes(field.key)
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => toggleField(field.key)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{field.label || field.key}</span>
                        {isSelected && <Check size={18} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-700/30 border border-zinc-600 text-center">
              <div className="text-zinc-400">계산 가능한 필드가 없습니다.</div>
              <div className="text-sm text-zinc-500 mt-1">int 타입 필드를 추가해주세요.</div>
            </div>
          )}

          {/* 계산 결과 */}
          {selectedFields.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">계산 결과</h3>
              <div className="space-y-3">
                {selectedFields.map((fieldKey) => {
                  const field = itemFields.find(f => f.key === fieldKey)
                  const total = totals[fieldKey] || 0
                  return (
                    <div
                      key={fieldKey}
                      className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300 font-medium">{field?.label || fieldKey}</span>
                        <span className="text-2xl font-bold text-cyan-400">
                          {total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {selectedFields.length > 1 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-2 border-cyan-500/50">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-100 font-bold text-lg">전체 합계</span>
                      <span className="text-3xl font-bold text-cyan-300">
                        {Object.values(totals).reduce((sum, val) => sum + val, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-zinc-600/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

// 필드 열람 권한 설정 모달 컴포넌트
function FieldVisibilityModal({ currentCollection, fieldVisibility, exampleItem, onClose, onApply, onShare }) {
  const [localVisibility, setLocalVisibility] = useState(fieldVisibility || {})

  const itemFields = currentCollection?.itemFields || []

  const toggleFieldVisibility = (fieldKey) => {
    setLocalVisibility((prev) => ({
      ...prev,
      [fieldKey]: prev[fieldKey] === 0 ? 1 : 0, // 0: 공개, 1: 비공개
    }))
  }

  // 예시 아이템 생성 (실제 아이템이 없으면 더미 데이터)
  const previewItem = exampleItem || {
    name: '예시 아이템',
    image: '',
    fields: itemFields.reduce((acc, field) => {
      acc[field.key] = `예시 ${field.label || field.key}`
      return acc
    }, {}),
  }

  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[1000px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 왼쪽: 미리보기 카드 */}
        <div className="w-1/2 border-r border-zinc-600/50 p-6 flex items-center justify-center bg-zinc-900/50">
          <div className="w-full max-w-[320px]">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4">미리보기</h3>
            <div className="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-lg">
              <div className="aspect-[4/3] bg-zinc-700/50 flex items-center justify-center overflow-hidden">
                {previewItem.image && !previewItem.image.startsWith('icon:') ? (
                  <img src={previewItem.image} alt={previewItem.name} className="w-full h-full object-cover" />
                ) : (
                  <Image size={48} className="text-zinc-500" />
                )}
              </div>
              <div className="p-5">
                <div className="text-lg font-bold text-zinc-100 mb-3">{previewItem.name}</div>
                <div className="flex flex-col gap-2">
                  {itemFields
                    .filter(field => previewItem.fields?.[field.key] !== undefined && previewItem.fields?.[field.key] !== null && previewItem.fields?.[field.key] !== '')
                    .map((field) => {
                      const isPublic = localVisibility[field.key] === 0 || localVisibility[field.key] === undefined
                      const value = isPublic ? previewItem.fields[field.key] : '***'
                      return (
                        <div
                          key={field.key}
                          className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-700/50 last:border-0"
                        >
                          <span className="text-zinc-400 font-semibold">{field.label || field.key}</span>
                          <span className={`font-medium ${isPublic ? 'text-zinc-200' : 'text-zinc-500'}`}>
                            {value}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 설정 패널 */}
        <div className="w-1/2 flex flex-col">
          <div className="px-6 py-5 border-b border-zinc-600/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-zinc-100">필드 열람 권한 설정</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-3">
            <p className="text-sm text-zinc-400 mb-4">
              공개할 필드를 선택하세요. 녹색은 공개(보임), 기본색은 비공개(숨김)입니다.
            </p>
            {itemFields.map((field) => {
              const isPublic = localVisibility[field.key] === 0 || localVisibility[field.key] === undefined
              return (
                <div
                  key={field.key}
                  className="flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer"
                  style={{
                    borderColor: isPublic ? '#10b981' : '#52525b',
                    backgroundColor: isPublic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(63, 63, 70, 0.3)',
                  }}
                  onClick={() => toggleFieldVisibility(field.key)}
                >
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <Unlock size={20} className="text-green-400" />
                    ) : (
                      <Lock size={20} className="text-zinc-400" />
                    )}
                    <span className={`font-medium ${isPublic ? 'text-green-400' : 'text-zinc-300'}`}>
                      {field.label || field.key}
                    </span>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-all ${
                      isPublic ? 'bg-green-500' : 'bg-zinc-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-all mt-0.5 ${
                        isPublic ? 'ml-6' : 'ml-0.5'
                      }`}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-6 py-5 border-t border-zinc-600/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-zinc-700/50 text-zinc-300 font-medium hover:bg-zinc-600 transition-colors"
            >
              취소
            </button>
            {onShare ? (
              <button
                onClick={async () => {
                  // 저장하고 공유하기
                  await onApply(localVisibility)
                  await onShare(localVisibility)
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all"
              >
                저장하고 공유하기
              </button>
            ) : (
              <button
                onClick={() => onApply(localVisibility)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                저장
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 아이템 상세 모달 컴포넌트
function ItemDetailModal({ item, itemFields, onClose }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '-'
    }
  }

  const visibleFields = itemFields.filter(field => 
    item.fields?.[field.key] !== undefined && 
    item.fields?.[field.key] !== null && 
    item.fields?.[field.key] !== ''
  )

  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">{item.name || '아이템 상세'}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-6 h-full">
            {/* 왼쪽: 이미지 */}
            <div className="w-1/2 flex items-center justify-center bg-zinc-900/50 rounded-xl p-6 min-h-[400px]">
              {item.image && !item.image.startsWith('icon:') ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center bg-zinc-700/50 rounded-lg">
                  <Image size={64} className="text-zinc-500" />
                </div>
              )}
            </div>

            {/* 오른쪽: 필드 정보 */}
            <div className="w-1/2 flex flex-col gap-4">
              <div className="space-y-3">
                {visibleFields.map((field) => {
                  const value = item.fields[field.key]
                  const valueStr = String(value || '')
                  const isLongText = field.type === 'memo' || valueStr.length > 50
                  const isLink = field.type === 'purchasePlace' || valueStr.startsWith('http')
                  
                  return (
                    <div key={field.key} className="border-b border-zinc-700/50 pb-3 last:border-0">
                      <div className="text-sm font-semibold text-zinc-400 mb-2">
                        {field.label || field.key}
                      </div>
                      <div className="text-zinc-100">
                        {isLink ? (
                          <a
                            href={valueStr}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 break-all"
                          >
                            {valueStr}
                          </a>
                        ) : isLongText ? (
                          <div className="whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                            {valueStr}
                          </div>
                        ) : (
                          <div>{valueStr}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 하단: 작성/수정 시간 */}
        <div className="px-6 py-4 border-t border-zinc-600/50 flex justify-between items-center text-sm text-zinc-400">
          <div>
            <span className="font-semibold">최초 작성:</span>{' '}
            <span>{formatDate(item.createdAt)}</span>
          </div>
          <div>
            <span className="font-semibold">최종 수정:</span>{' '}
            <span>{formatDate(item.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
