# Prompt Master Architect 🏛️

Gemini 3 Pro의 심층 추론(Deep Reasoning) 기능을 활용하여 사용자의 간단한 아이디어를 구조화된 고성능 프롬프트로 변환해주는 모바일 최적화 웹 서비스입니다.

## 주요 기능
- **Intent Discovery**: 모호한 입력을 분석하여 핵심 질문을 던져 의도를 구체화합니다.
- **Deep Reasoning**: Gemini 3 Pro의 `thinkingBudget`을 활용하여 논리적인 프롬프트 아키텍처를 설계합니다.
- **Structured Prompting**: [페르소나 - 단계 - 제약 - 규격]의 전문적인 마크다운 형식을 제공합니다.
- **Prompt Editor**: 생성된 결과를 즉시 수정하고 복사할 수 있습니다.
- **Library**: 과거에 설계했던 프롬프트 이력을 로컬에 저장하고 다시 불러올 수 있습니다.

## 설치 및 배포 방법

### 1. 환경 변수 설정
이 프로젝트는 Gemini API를 사용합니다. 배포 환경(Vercel, Netlify 등)에서 아래 환경 변수를 반드시 설정해야 합니다.
- `API_KEY`: [Google AI Studio](https://aistudio.google.com/)에서 발급받은 API 키

### 2. 배포 (Vercel 기준)
1. GitHub 저장소를 Vercel에 연결합니다.
2. `API_KEY` 환경 변수를 등록합니다.
3. Deploy 버튼을 클릭하여 배포를 완료합니다.

## 기술 스택
- **Frontend**: React, Tailwind CSS, Lucide React
- **AI**: Google Gemini API (@google/genai)
- **Model**: `gemini-3-pro-preview` (Thinking Mode 활성화)

## 라이선스
MIT License
