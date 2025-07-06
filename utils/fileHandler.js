// AI審査員システム - ファイル処理ユーティリティ

class FileHandler {
    constructor() {
        this.maxFileSize = OPENAI_CONFIG.maxFileSize;
        this.supportedFormats = OPENAI_CONFIG.supportedFormats;
    }

    // ファイルの基本検証
    validateFile(file, type) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // ファイルサイズチェック
        if (file.size > this.maxFileSize) {
            validation.isValid = false;
            validation.errors.push(`ファイルサイズが上限（${this.formatFileSize(this.maxFileSize)}）を超えています`);
        }

        // ファイル形式チェック
        const allowedTypes = this.supportedFormats[type];
        if (!allowedTypes.includes(file.type)) {
            validation.isValid = false;
            validation.errors.push(`対応していないファイル形式です。対応形式: ${this.getFormatsString(type)}`);
        }

        // 警告チェック
        if (file.size > this.maxFileSize * 0.8) {
            validation.warnings.push('ファイルサイズが大きいため、処理に時間がかかる場合があります');
        }

        return validation;
    }

    // ファイルサイズを読みやすい形式に変換
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 対応形式の文字列を取得
    getFormatsString(type) {
        const formats = {
            slide: 'PDF, PowerPoint(.ppt/.pptx)',
            audio: 'MP3, WAV, M4A'
        };
        return formats[type] || '未知のタイプ';
    }

    // ファイル情報を取得
    getFileInfo(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified),
            sizeFormatted: this.formatFileSize(file.size)
        };
    }

    // スライドファイル専用処理
    async processSlideFile(file) {
        const info = this.getFileInfo(file);
        
        try {
            if (file.type === 'application/pdf') {
                return await this.processPDFFile(file);
            } else if (this.isPowerPointFile(file)) {
                return await this.processPowerPointFile(file);
            } else {
                throw new Error('対応していないスライドファイル形式です（PDF、PowerPointのみ対応）');
            }
        } catch (error) {
            throw new Error(`スライドファイル処理エラー: ${error.message}`);
        }
    }

    // PDFファイル処理
    async processPDFFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve({
                    type: 'pdf',
                    data: e.target.result,
                    info: this.getFileInfo(file),
                    preview: {
                        type: 'pdf',
                        fileName: file.name,
                        pageCount: 'PDFページ数は読み込み後に確認できます'
                    }
                });
            };
            
            reader.onerror = () => {
                reject(new Error('PDFファイルの読み込みに失敗しました'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // PowerPointファイル処理
    async processPowerPointFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve({
                    type: 'powerpoint',
                    data: e.target.result,
                    info: this.getFileInfo(file),
                    preview: {
                        type: 'powerpoint',
                        fileName: file.name,
                        fileType: file.type.includes('vnd.ms-powerpoint') ? 'PPT' : 'PPTX'
                    }
                });
            };
            
            reader.onerror = () => {
                reject(new Error('PowerPointファイルの読み込みに失敗しました'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // 画像ファイル処理（削除予定）
    async processImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    resolve({
                        type: 'image',
                        data: e.target.result,
                        info: this.getFileInfo(file),
                        preview: {
                            type: 'image',
                            src: e.target.result,
                            dimensions: {
                                width: img.width,
                                height: img.height
                            }
                        }
                    });
                };
                
                img.onerror = () => {
                    reject(new Error('画像ファイルの読み込みに失敗しました'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                reject(new Error('画像ファイルの読み込みに失敗しました'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    // 音声ファイル処理
    async processAudioFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const audio = new Audio();
                
                audio.onloadedmetadata = () => {
                    resolve({
                        type: 'audio',
                        data: e.target.result,
                        info: this.getFileInfo(file),
                        preview: {
                            type: 'audio',
                            src: e.target.result,
                            duration: audio.duration,
                            durationFormatted: this.formatDuration(audio.duration)
                        }
                    });
                };
                
                audio.onerror = () => {
                    reject(new Error('音声ファイルの読み込みに失敗しました'));
                };
                
                audio.src = e.target.result;
            };
            
            reader.onerror = () => {
                reject(new Error('音声ファイルの読み込みに失敗しました'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    // 再生時間を読みやすい形式に変換
    formatDuration(seconds) {
        if (isNaN(seconds) || seconds < 0) return '不明';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Base64エンコード
    async encodeToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1];
                resolve(base64);
            };
            
            reader.onerror = () => {
                reject(new Error('Base64エンコードに失敗しました'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    // ファイルを準備してAPI用に変換
    async prepareFileForAPI(file, type) {
        const validation = this.validateFile(file, type);
        
        if (!validation.isValid) {
            throw new Error(validation.errors.join('\n'));
        }

        try {
            if (type === 'slide') {
                const processed = await this.processSlideFile(file);
                return {
                    ...processed,
                    base64: await this.encodeToBase64(file),
                    validation
                };
            } else if (type === 'audio') {
                const processed = await this.processAudioFile(file);
                return {
                    ...processed,
                    file: file, // 音声ファイルは元のFileオブジェクトも保持
                    validation
                };
            }
        } catch (error) {
            throw new Error(`ファイル準備エラー: ${error.message}`);
        }
    }

    // ドラッグ&ドロップのセットアップ
    setupDragAndDrop(element, onFileDropped, allowedType) {
        // dragoverイベント
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.add('drag-over');
        });

        // dragleaveイベント
        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('drag-over');
        });

        // dropイベント
        element.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            element.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files);
            
            if (files.length === 0) {
                return;
            }

            if (files.length > 1) {
                alert('一度に1つのファイルのみアップロードできます');
                return;
            }

            try {
                const processedFile = await this.prepareFileForAPI(files[0], allowedType);
                onFileDropped(processedFile);
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // ファイル形式判定
    isPowerPointFile(file) {
        return /\.(ppt|pptx)$/i.test(file.name) || 
               file.type === 'application/vnd.ms-powerpoint' ||
               file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }

    isPDFFile(file) {
        return /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
    }

    // プレビューHTML生成
    generatePreviewHTML(processedFile) {
        const { type, preview, info } = processedFile;

        let html = `
            <div class="file-info">
                <h4>${info.name}</h4>
                <p>サイズ: ${info.sizeFormatted}</p>
                <p>形式: ${info.type}</p>
            </div>
        `;

        if (type === 'pdf') {
            html += `
                <div class="pdf-preview">
                    <div class="pdf-icon">📄</div>
                    <p>PDFファイル</p>
                    <p>${preview.pageCount}</p>
                </div>
            `;
        } else if (type === 'powerpoint') {
            html += `
                <div class="powerpoint-preview">
                    <div class="powerpoint-icon">📊</div>
                    <p>PowerPoint ${preview.fileType}ファイル</p>
                    <p>スライド解析準備完了</p>
                </div>
            `;
        } else if (type === 'image') {
            html += `
                <div class="image-preview">
                    <img src="${preview.src}" alt="スライドプレビュー" style="max-width: 100%; height: auto;">
                    <p>解像度: ${preview.dimensions.width} × ${preview.dimensions.height}</p>
                </div>
            `;
        } else if (type === 'audio') {
            html += `
                <div class="audio-preview">
                    <audio controls style="width: 100%;">
                        <source src="${preview.src}" type="${info.type}">
                        お使いのブラウザは音声の再生をサポートしていません。
                    </audio>
                    <p>再生時間: ${preview.durationFormatted}</p>
                </div>
            `;
        }

        return html;
    }

    // ファイル削除
    clearFile(type) {
        const previewElement = document.getElementById(`${type}Preview`);
        if (previewElement) {
            previewElement.style.display = 'none';
            previewElement.innerHTML = '';
        }

        const fileInput = document.getElementById(`${type}File`);
        if (fileInput) {
            fileInput.value = '';
        }
    }

    // エラーメッセージを表示
    showError(message, element) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.marginTop = '10px';
        errorDiv.style.padding = '10px';
        errorDiv.style.backgroundColor = '#fdf2f2';
        errorDiv.style.border = '1px solid #e74c3c';
        errorDiv.style.borderRadius = '4px';

        element.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileHandler;
}