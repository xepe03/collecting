// 컬렉션 생성 시 사용할 기본 필드 옵션
export const DEFAULT_FIELD_OPTIONS = [
  {
    key: 'grade',
    type: 'grade',
    label: '등급(PSA,BGS)',
    disabled: false,
  },
  {
    key: 'price',
    type: 'price',
    label: '가격',
    disabled: false,
  },
  {
    key: 'purchaseDate',
    type: 'purchaseDate',
    label: '구매일',
    disabled: false,
  },
  {
    key: 'purchasePlace',
    type: 'purchasePlace',
    label: '구매장소',
    disabled: false,
  },
  {
    key: 'language',
    type: 'language',
    label: '언어',
    disabled: false,
  },
  {
    key: 'series',
    type: 'series',
    label: '시리즈',
    disabled: true,
  },
  {
    key: 'marketPrice',
    type: 'marketPrice',
    label: '시세',
    disabled: true,
  },
  {
    key: 'memo',
    type: 'memo',
    label: '메모',
    disabled: false,
  },
]

export const GRADE_OPTIONS = ['PSA', 'BGS', 'CGC', 'BRG', 'ARS']
export const GRADE_NUMBERS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

export const LANGUAGE_OPTIONS = ['한국어', '중국어', '영어', '일본어', '기타']

export const COLLECTION_TAGS = ['수집형카드', '기타']

export const THUMBNAIL_ICONS = [
  { id: 'folder', label: '폴더' },
  { id: 'credit-card', label: '카드' },
  { id: 'image', label: '이미지' },
  { id: 'package', label: '상자' },
]
