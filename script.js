class DrawingStyleAnalyzer {
    constructor() {
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.analyzeButton = document.getElementById('analyzeButton');
        this.resultSection = document.getElementById('resultSection');
        this.promptText = document.getElementById('promptText');
        this.copyButton = document.getElementById('copyButton');
        
        this.selectedFiles = [];
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
        
        // 복사 버튼 이벤트
        this.copyButton.addEventListener('click', this.copyToClipboard.bind(this));
        
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
        files.forEach(file => {
            if (!this.selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
                this.selectedFiles.push(file);
            }
        });
        
        this.updatePreview();
        this.updateAnalyzeButton();
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updatePreview();
        this.updateAnalyzeButton();
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

    displayResult(prompt) {
        this.promptText.textContent = prompt;
        this.resultSection.hidden = false;
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
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

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.promptText.textContent);
            
            // 성공 표시
            const originalText = this.copyButton.innerHTML;
            this.copyButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                복사완료!
            `;
            this.copyButton.classList.add('copy-success');
            
            setTimeout(() => {
                this.copyButton.innerHTML = originalText;
                this.copyButton.classList.remove('copy-success');
            }, 2000);
            
        } catch (error) {
            console.error('클립보드 복사 실패:', error);
            // 폴백: 텍스트 선택
            const range = document.createRange();
            range.selectNode(this.promptText);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }
    }
}

// 전역 변수로 인스턴스 생성
const analyzer = new DrawingStyleAnalyzer();
