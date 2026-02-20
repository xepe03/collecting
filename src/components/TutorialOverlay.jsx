import { useState, useEffect, useCallback } from 'react'
import { X, ArrowRight } from 'lucide-react'

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: '모드를 변경합니다',
    description: 'Tab 키를 누르거나 버튼을 클릭하여 에디트 모드로 전환하세요',
    targetButton: 'editModeToggle',
    position: 'right',
  },
  {
    id: 2,
    title: '아이템 기록에 필요한 필드를 설정합니다',
    description: '필드 관리 버튼을 클릭하여 필요한 필드를 추가하거나 수정하세요',
    targetButton: 'fieldManage',
    position: 'right',
  },
  {
    id: 3,
    title: '아이템을 생성합니다',
    description: '아이템 추가 버튼을 클릭하여 첫 번째 아이템을 만들어보세요',
    targetButton: 'addItem',
    position: 'right',
  },
  {
    id: 4,
    title: '여러 개를 연속으로 수정하고 싶으면 리스트 모드로 변경하세요',
    description: '엑셀 모드로 전환하면 여러 아이템을 한 번에 수정할 수 있습니다',
    targetButton: 'viewModeToggle',
    position: 'right',
  },
]

export default function TutorialOverlay({
  totalItems,
  selectedCollection,
  tutorialCompleted,
  onSetTutorialCompleted,
  onComplete,
  editModeButtonRef,
  fieldManageButtonRef,
  addItemButtonRef,
  viewModeButtonRef,
  onEditModeClick,
  onFieldManageClick,
  onAddItemClick,
  onViewModeClick,
  onToggleEditMode,
}) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const handleNext = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c35dc0f5-000f-408a-9c62-5a11f884f20b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TutorialOverlay.jsx:54',message:'handleNext 호출',data:{},timestamp:Date.now(),runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setCurrentStep((prev) => {
      const nextStep = prev + 1
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c35dc0f5-000f-408a-9c62-5a11f884f20b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TutorialOverlay.jsx:58',message:'handleNext: currentStep 변경',data:{prev,nextStep,stepsLength:TUTORIAL_STEPS.length},timestamp:Date.now(),runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (prev < TUTORIAL_STEPS.length - 1) {
        return nextStep
      } else {
        // 튜토리얼 완료
        onSetTutorialCompleted?.()
        setIsVisible(false)
        onComplete?.()
        return prev
      }
    })
  }, [onSetTutorialCompleted, onComplete])

  useEffect(() => {
    // 컬렉션이 선택되어 있고, 전체 아이템이 0개이고, 튜토리얼이 완료되지 않은 경우에만 표시
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c35dc0f5-000f-408a-9c62-5a11f884f20b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TutorialOverlay.jsx:68',message:'튜토리얼 표시 조건 체크',data:{selectedCollection:!!selectedCollection,totalItems,tutorialCompleted,willShow:selectedCollection && totalItems === 0 && !tutorialCompleted},timestamp:Date.now(),runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (selectedCollection && totalItems === 0 && !tutorialCompleted) {
      // 튜토리얼이 처음 시작될 때만 currentStep을 0으로 설정
      setIsVisible((prevVisible) => {
        if (!prevVisible) {
          setCurrentStep(0)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/c35dc0f5-000f-408a-9c62-5a11f884f20b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TutorialOverlay.jsx:72',message:'튜토리얼 표시됨 (처음 시작)',data:{isVisible:true,currentStep:0},timestamp:Date.now(),runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        }
        return true
      })
    } else {
      setIsVisible(false)
      if (totalItems > 0) {
        onSetTutorialCompleted?.()
        onComplete?.()
      }
    }
  }, [selectedCollection, totalItems, tutorialCompleted, onComplete, onSetTutorialCompleted])
  
  // Tab 키로 튜토리얼 진행 (1단계만)
  useEffect(() => {
    if (!isVisible || currentStep !== 0) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement
        const isInputFocused = 
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          activeElement?.tagName === 'SELECT' ||
          activeElement?.isContentEditable
        
        if (!isInputFocused) {
          e.preventDefault()
          handleNext()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, currentStep, handleNext])

  const handleSkip = () => {
    onSetTutorialCompleted?.()
    setIsVisible(false)
    onComplete?.()
  }

  const handleButtonClick = useCallback((buttonType) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c35dc0f5-000f-408a-9c62-5a11f884f20b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TutorialOverlay.jsx:112',message:'handleButtonClick 호출',data:{currentStep,buttonType},timestamp:Date.now(),runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // 버튼 클릭 시 다음 단계로만 이동
    if (currentStep === 0 && buttonType === 'editMode') {
      // 첫 번째 단계: editMode를 true로 설정해야 다음 버튼들이 보임
      onToggleEditMode?.(true)
      handleNext()
    } else if (currentStep === 1 && buttonType === 'fieldManage') {
      handleNext()
    } else if (currentStep === 2 && buttonType === 'addItem') {
      handleNext()
    } else if (currentStep === 3 && buttonType === 'viewMode') {
      handleNext()
    }
  }, [currentStep, handleNext, onToggleEditMode])

  if (!isVisible || currentStep >= TUTORIAL_STEPS.length) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c35dc0f5-000f-408a-9c62-5a11f884f20b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TutorialOverlay.jsx:127',message:'튜토리얼 렌더링 스킵',data:{isVisible,currentStep,stepsLength:TUTORIAL_STEPS.length},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return null
  }

  const step = TUTORIAL_STEPS[currentStep]
  let targetRef = null
  let buttonHandler = null

  switch (step.targetButton) {
    case 'editModeToggle':
      targetRef = editModeButtonRef
      buttonHandler = () => {
        console.log('튜토리얼: editMode 버튼 클릭')
        handleButtonClick('editMode')
      }
      break
    case 'fieldManage':
      targetRef = fieldManageButtonRef
      buttonHandler = () => {
        console.log('튜토리얼: fieldManage 버튼 클릭')
        handleButtonClick('fieldManage')
      }
      break
    case 'addItem':
      targetRef = addItemButtonRef
      buttonHandler = () => {
        console.log('튜토리얼: addItem 버튼 클릭')
        handleButtonClick('addItem')
      }
      break
    case 'viewModeToggle':
      targetRef = viewModeButtonRef
      buttonHandler = () => {
        console.log('튜토리얼: viewMode 버튼 클릭')
        handleButtonClick('viewMode')
      }
      break
  }

  // ref가 없으면 중앙에 표시
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c35dc0f5-000f-408a-9c62-5a11f884f20b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TutorialOverlay.jsx:174',message:'targetRef 상태 확인',data:{currentStep,targetButton:step.targetButton,hasTargetRef:!!targetRef?.current,editModeRef:!!editModeButtonRef?.current,fieldManageRef:!!fieldManageButtonRef?.current,addItemRef:!!addItemButtonRef?.current,viewModeRef:!!viewModeButtonRef?.current},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  if (!targetRef?.current) {
    console.warn('튜토리얼: targetRef가 없습니다', step.targetButton, {
      editMode: !!editModeButtonRef?.current,
      fieldManage: !!fieldManageButtonRef?.current,
      addItem: !!addItemButtonRef?.current,
      viewMode: !!viewModeButtonRef?.current,
    })
  }

  // 툴팁은 항상 화면 중앙에 표시
  const tooltipStyle = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c35dc0f5-000f-408a-9c62-5a11f884f20b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TutorialOverlay.jsx:207',message:'튜토리얼 렌더링 시작',data:{isVisible,currentStep,hasTargetRef:!!targetRef?.current,stepTitle:step.title},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return (
    <>
      {/* 어두운 오버레이 (버튼 영역 제외) */}
      {targetRef?.current ? (() => {
        const rect = targetRef.current.getBoundingClientRect()
        const scrollY = window.scrollY
        const scrollX = window.scrollX
        const top = rect.top + scrollY
        const left = rect.left + scrollX
        const bottom = rect.bottom + scrollY
        const right = rect.right + scrollX
        
        return (
          <>
            {/* 버튼 위쪽 영역 */}
            <div
              className="fixed z-[9998] bg-black/30 transition-opacity"
              style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: `${window.innerHeight - bottom}px`,
                pointerEvents: 'none',
              }}
            />
            {/* 버튼 왼쪽 영역 */}
            <div
              className="fixed z-[9998] bg-black/30 transition-opacity"
              style={{
                top: `${top}px`,
                left: 0,
                width: `${left}px`,
                bottom: `${window.innerHeight - bottom}px`,
                pointerEvents: 'none',
              }}
            />
            {/* 버튼 오른쪽 영역 */}
            <div
              className="fixed z-[9998] bg-black/30 transition-opacity"
              style={{
                top: `${top}px`,
                left: `${right}px`,
                right: 0,
                bottom: `${window.innerHeight - bottom}px`,
                pointerEvents: 'none',
              }}
            />
            {/* 버튼 아래쪽 영역 */}
            <div
              className="fixed z-[9998] bg-black/30 transition-opacity"
              style={{
                top: `${bottom}px`,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
              }}
            />
          </>
        )
      })() : (
        <div
          className="fixed inset-0 bg-black/30 z-[9998] transition-opacity"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* 하이라이트된 버튼 영역 (더 강조) */}
      {targetRef?.current && (
        <>
          <div
            className="fixed z-[9999] rounded-lg pointer-events-none animate-pulse"
            style={{
              top: `${targetRef.current.getBoundingClientRect().top + window.scrollY - 4}px`,
              left: `${targetRef.current.getBoundingClientRect().left + window.scrollX - 4}px`,
              width: `${targetRef.current.getBoundingClientRect().width + 8}px`,
              height: `${targetRef.current.getBoundingClientRect().height + 8}px`,
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4)',
              border: '3px solid rgba(59, 130, 246, 1)',
              borderRadius: '12px',
            }}
          />
          {/* 버튼 강조 효과 */}
          <div
            className="fixed z-[9999] rounded-lg pointer-events-none"
            style={{
              top: `${targetRef.current.getBoundingClientRect().top + window.scrollY}px`,
              left: `${targetRef.current.getBoundingClientRect().left + window.scrollX}px`,
              width: `${targetRef.current.getBoundingClientRect().width}px`,
              height: `${targetRef.current.getBoundingClientRect().height}px`,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '8px',
            }}
          />
        </>
      )}

      {/* 튜토리얼 툴팁 (화면 중앙) */}
      <div
        className="fixed z-[10000] bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-cyan-500/70 rounded-xl shadow-2xl p-6 max-w-sm"
        style={tooltipStyle}
      >
        
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">{step.title}</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">{step.description}</p>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
            title="튜토리얼 건너뛰기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center">
          {/* 진행도 표시 */}
          <div className="flex items-center gap-2">
            {TUTORIAL_STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx <= currentStep ? 'bg-cyan-500' : 'bg-zinc-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 버튼 클릭 인터셉터 (실제 버튼 클릭을 가로채서 튜토리얼 진행) */}
      {targetRef?.current && (
        <div
          className="fixed z-[10001] cursor-pointer"
          style={{
            top: `${targetRef.current.getBoundingClientRect().top + window.scrollY}px`,
            left: `${targetRef.current.getBoundingClientRect().left + window.scrollX}px`,
            width: `${targetRef.current.getBoundingClientRect().width}px`,
            height: `${targetRef.current.getBoundingClientRect().height}px`,
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('튜토리얼: 버튼 인터셉터 클릭', { currentStep })
            buttonHandler?.()
          }}
        />
      )}
    </>
  )
}

