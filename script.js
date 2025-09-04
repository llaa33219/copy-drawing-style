class DrawingStyleAnalyzer {
    constructor() {
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.analyzeButton = document.getElementById('analyzeButton');
        this.resultSection = document.getElementById('resultSection');
        
        // 새로운 UI 요소들
        this.mainPromptText = document.getElementById('mainPromptText');
        this.negativePromptText = document.getElementById('negativePromptText');
        this.fullAnalysisText = document.getElementById('fullAnalysisText');
        this.settingsGrid = document.getElementById('settingsGrid');
        
        this.selectedFiles = [];
        this.currentResult = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 업로드 존 이벤트
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadZone.addEventListener('drop', this.handleDrop.bind(this));
        
        // 파일 입력 이벤트
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // 분석 버튼 이벤트
        this.analyzeButton.addEventListener('click', this.analyzeImages.bind(this));
        
        // 탭 버튼 이벤트
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', this.switchTab.bind(this));
        });
        
        // 복사 버튼들 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.closest('.copy-button')) {
                const button = e.target.closest('.copy-button');
                const targetId = button.getAttribute('data-target');
                this.copyToClipboard(targetId, button);
            }
        });
        
        // Select 버튼 이벤트
        document.querySelector('.select-button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            this.addFiles(files);
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.addFiles(files);
        e.target.value = ''; // 같은 파일 재선택 가능하도록
    }

    addFiles(files) {
        // 20개 제한 체크
        let availableSlots = 20 - this.selectedFiles.length;
        let filesToAdd = [];
        
        files.forEach(file => {
            if (availableSlots > 0 && !this.selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
                filesToAdd.push(file);
                availableSlots--;
            }
        });
        
        this.selectedFiles.push(...filesToAdd);
        
        // 20개 초과 시 경고 표시
        if (files.length > filesToAdd.length) {
            this.showError(`최대 20개 이미지까지만 업로드할 수 있습니다. ${filesToAdd.length}개의 이미지가 추가되었습니다.`);
        }
        
        this.updatePreview();
        this.updateAnalyzeButton();
        this.updateImageCounter();
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updatePreview();
        this.updateAnalyzeButton();
        this.updateImageCounter();
    }

    updatePreview() {
        this.imagePreview.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}" class="preview-image">
                    <button class="remove-button" onclick="analyzer.removeFile(${index})">×</button>
                `;
                this.imagePreview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    updateAnalyzeButton() {
        this.analyzeButton.disabled = this.selectedFiles.length === 0;
    }

    updateImageCounter() {
        // 이미지 카운터 업데이트 (업로드 존에 카운터 표시)
        const existingCounter = document.querySelector('.image-counter');
        if (existingCounter) {
            existingCounter.remove();
        }
        
        if (this.selectedFiles.length > 0) {
            const counter = document.createElement('div');
            counter.className = 'image-counter';
            counter.innerHTML = `<span>선택된 이미지: ${this.selectedFiles.length}/20</span>`;
            this.uploadZone.appendChild(counter);
        }
    }

    async analyzeImages() {
        if (this.selectedFiles.length === 0) return;

        this.showLoading(true);
        
        try {
            // 이미지들을 base64로 변환
            const imageData = await Promise.all(
                this.selectedFiles.map(file => this.fileToBase64(file))
            );

            // API 호출
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    images: imageData
                })
            });

            if (!response.ok) {
                throw new Error(`API 오류: ${response.status}`);
            }

            const result = await response.json();
            this.displayResult(result.prompt);
            
        } catch (error) {
            console.error('분석 중 오류:', error);
            this.showError('분석 중 오류가 발생했습니다: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    displayResult(analysisResult) {
        this.currentResult = analysisResult;
        this.parseAndDisplayResult(analysisResult);
        this.resultSection.hidden = false;
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    parseAndDisplayResult(analysisResult) {
        try {
            // AI 응답에서 구조화된 정보 추출
            const sections = this.extractStructuredSections(analysisResult);
            
            // 메인 프롬프트 표시
            if (sections.masterPrompt) {
                this.mainPromptText.textContent = sections.masterPrompt;
            }
            
            // 네거티브 프롬프트 표시
            if (sections.negativePrompt) {
                this.negativePromptText.textContent = sections.negativePrompt;
            }
            
            // 설정값 표시
            if (sections.technicalParams) {
                this.displaySettings(sections.technicalParams);
            }
            
            // 전체 분석 결과 표시
            this.fullAnalysisText.textContent = analysisResult;
            
        } catch (error) {
            console.error('결과 파싱 중 오류:', error);
            // 파싱 실패 시 원본 텍스트 표시
            this.fullAnalysisText.textContent = analysisResult;
            this.mainPromptText.textContent = "파싱 오류 - 전체 분석 결과 탭을 확인하세요.";
        }
    }

    extractStructuredSections(text) {
        const sections = {};
        
        // 마스터 프롬프트 추출
        const masterPromptMatch = text.match(/\*\*MASTER PROMPT:\*\*\s*\n"([^"]+)"/);
        if (masterPromptMatch) {
            sections.masterPrompt = masterPromptMatch[1].trim();
        }
        
        // 네거티브 프롬프트 추출
        const negativePromptMatch = text.match(/\*\*NEGATIVE PROMPT:\*\*\s*\n"([^"]+)"/);
        if (negativePromptMatch) {
            sections.negativePrompt = negativePromptMatch[1].trim();
        }
        
        // 기술적 매개변수 추출
        const paramsSection = text.match(/\*\*TECHNICAL PARAMETERS:\*\*([\s\S]*?)(?=\*\*|$)/);
        if (paramsSection) {
            sections.technicalParams = this.parseParameters(paramsSection[1]);
        }
        
        return sections;
    }

    parseParameters(paramsText) {
        const params = {};
        
        const cfgMatch = paramsText.match(/CFG Scale:\s*([^\n]+)/);
        if (cfgMatch) params.cfgScale = cfgMatch[1].trim();
        
        const stepsMatch = paramsText.match(/Steps:\s*([^\n]+)/);
        if (stepsMatch) params.steps = stepsMatch[1].trim();
        
        const samplerMatch = paramsText.match(/Sampling Method:\s*([^\n]+)/);
        if (samplerMatch) params.sampler = samplerMatch[1].trim();
        
        return params;
    }

    displaySettings(params) {
        this.settingsGrid.innerHTML = '';
        
        Object.entries(params).forEach(([key, value]) => {
            const settingItem = document.createElement('div');
            settingItem.className = 'setting-item';
            
            const label = this.getSettingLabel(key);
            settingItem.innerHTML = `
                <span class="setting-label">${label}</span>
                <span class="setting-value">${value}</span>
            `;
            
            this.settingsGrid.appendChild(settingItem);
        });
    }

    getSettingLabel(key) {
        const labels = {
            cfgScale: 'CFG Scale',
            steps: 'Steps',
            sampler: 'Sampling Method'
        };
        return labels[key] || key;
    }

    switchTab(event) {
        const targetTab = event.target.getAttribute('data-tab');
        
        // 모든 탭 버튼 비활성화
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 모든 탭 컨텐츠 숨김
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // 선택된 탭 활성화
        event.target.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    }

    showLoading(show) {
        const buttonText = this.analyzeButton.querySelector('.button-text');
        const spinner = this.analyzeButton.querySelector('.spinner');
        
        if (show) {
            buttonText.textContent = '분석 중...';
            spinner.hidden = false;
            this.analyzeButton.disabled = true;
        } else {
            buttonText.textContent = '스타일 분석 시작';
            spinner.hidden = true;
            this.analyzeButton.disabled = this.selectedFiles.length === 0;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // 기존 에러 메시지 제거
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        this.analyzeButton.parentNode.insertBefore(errorDiv, this.analyzeButton.nextSibling);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    async copyToClipboard(targetId, button) {
        try {
            const targetElement = document.getElementById(targetId);
            if (!targetElement) return;
            
            const textToCopy = targetElement.textContent;
            await navigator.clipboard.writeText(textToCopy);
            
            // 성공 표시
            const originalText = button.innerHTML;
            button.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                복사완료!
            `;
            button.classList.add('copy-success');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('copy-success');
            }, 2000);
            
        } catch (error) {
            console.error('클립보드 복사 실패:', error);
            // 폴백: 텍스트 선택
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const range = document.createRange();
                range.selectNode(targetElement);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
            }
        }
    }
}

// 전역 변수로 인스턴스 생성
const analyzer = new DrawingStyleAnalyzer();
