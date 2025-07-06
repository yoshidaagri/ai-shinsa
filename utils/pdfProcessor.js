// AI審査員システム - PDF処理ユーティリティ (scripts_sample.jsから移植)

class PDFProcessor {
    constructor() {
        // PDF.jsライブラリが利用可能かチェック
        this.isAvailable = typeof pdfjsLib !== 'undefined';
        if (!this.isAvailable) {
            console.warn('PDF.js library not found. PDF processing will be limited.');
        }
    }

    // PDFファイルからテキストを抽出（レイアウト保持）
    async extractTextFromPDF(file) {
        if (!this.isAvailable) {
            throw new Error('PDF.js library is not available');
        }

        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = async () => {
                try {
                    const typedarray = new Uint8Array(fileReader.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    
                    const maxPages = pdf.numPages;
                    const pageTextPromises = [];
                    
                    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                        pageTextPromises.push(this.extractPageText(pdf, pageNum));
                    }
                    
                    const pagesText = await Promise.all(pageTextPromises);
                    const fullText = pagesText.join('\n\n');
                    
                    resolve({
                        text: fullText,
                        pageCount: maxPages,
                        pages: pagesText
                    });
                } catch (error) {
                    console.error('PDF processing error:', error);
                    reject(error);
                }
            };
            
            fileReader.onerror = () => {
                reject(new Error('PDFファイルの読み込みに失敗しました'));
            };
            
            fileReader.readAsArrayBuffer(file);
        });
    }

    // 個別ページのテキスト抽出（レイアウト保持）
    async extractPageText(pdf, pageNum) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        let textItems = textContent.items;
        
        // テキストアイテムをY座標（降順）とX座標（昇順）でソート
        textItems.sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5];
            if (Math.abs(yDiff) < 5) {
                return a.transform[4] - b.transform[4];
            }
            return yDiff;
        });

        // Y座標の近さでアイテムをグループ化して行ごとにまとめる
        const lines = this.groupTextItemsIntoLines(textItems);
        
        return lines.join('\n');
    }

    // テキストアイテムを行にグループ化
    groupTextItemsIntoLines(textItems) {
        const lines = [];
        let currentLine = [];
        let currentY = null;
        
        textItems.forEach(item => {
            const itemY = item.transform[5];
            
            if (currentY === null || Math.abs(itemY - currentY) < 5) {
                currentLine.push(item);
                if (currentY === null) currentY = itemY;
            } else {
                // 現在の行を処理
                if (currentLine.length > 0) {
                    lines.push(this.processLine(currentLine));
                }
                
                // 新しい行の開始
                currentLine = [item];
                currentY = itemY;
            }
        });
        
        // 残った最後の行を処理
        if (currentLine.length > 0) {
            lines.push(this.processLine(currentLine));
        }
        
        return lines;
    }

    // 行内のテキストアイテムを適切な間隔で連結
    processLine(lineItems) {
        // X座標でソート（昇順）
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
        
        let lineText = '';
        
        for (let i = 0; i < lineItems.length; i++) {
            if (i > 0) {
                const prevItem = lineItems[i - 1];
                const currentItem = lineItems[i];
                
                // 前のアイテムとの間隔を計算
                const gap = currentItem.transform[4] - (prevItem.transform[4] + (prevItem.width || 0));
                
                // 5ポイント以上の間隔がある場合はスペースを挿入
                if (gap > 5) {
                    const numSpaces = Math.max(1, Math.floor(gap / 5));
                    lineText += ' '.repeat(numSpaces);
                }
            }
            
            lineText += lineItems[i].str;
        }
        
        return lineText;
    }

    // PDFメタデータの取得
    async extractMetadata(file) {
        if (!this.isAvailable) {
            return null;
        }

        try {
            const fileReader = new FileReader();
            
            return new Promise((resolve, reject) => {
                fileReader.onload = async () => {
                    try {
                        const typedarray = new Uint8Array(fileReader.result);
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        const metadata = await pdf.getMetadata();
                        
                        resolve({
                            pageCount: pdf.numPages,
                            title: metadata.info.Title || '',
                            author: metadata.info.Author || '',
                            subject: metadata.info.Subject || '',
                            creator: metadata.info.Creator || '',
                            producer: metadata.info.Producer || '',
                            creationDate: metadata.info.CreationDate || '',
                            modificationDate: metadata.info.ModDate || ''
                        });
                    } catch (error) {
                        resolve(null);
                    }
                };
                
                fileReader.onerror = () => resolve(null);
                fileReader.readAsArrayBuffer(file);
            });
        } catch (error) {
            return null;
        }
    }

    // PDFページを画像として取得（プレビュー用）
    async renderPageAsImage(file, pageNum = 1, scale = 1.0) {
        if (!this.isAvailable) {
            return null;
        }

        try {
            const fileReader = new FileReader();
            
            return new Promise((resolve, reject) => {
                fileReader.onload = async () => {
                    try {
                        const typedarray = new Uint8Array(fileReader.result);
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        const page = await pdf.getPage(pageNum);
                        
                        const viewport = page.getViewport({ scale });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        
                        await page.render(renderContext).promise;
                        
                        resolve(canvas.toDataURL());
                    } catch (error) {
                        resolve(null);
                    }
                };
                
                fileReader.onerror = () => resolve(null);
                fileReader.readAsArrayBuffer(file);
            });
        } catch (error) {
            return null;
        }
    }

    // PDF構造解析（見出し、段落の識別）
    async analyzeStructure(file) {
        try {
            const result = await this.extractTextFromPDF(file);
            const pages = result.pages;
            
            const structure = {
                headings: [],
                paragraphs: [],
                tables: [],
                lists: []
            };
            
            pages.forEach((pageText, pageIndex) => {
                const lines = pageText.split('\n');
                
                lines.forEach((line, lineIndex) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) return;
                    
                    // 見出しの推定（短い行、大文字、数字で始まる等）
                    if (this.isLikelyHeading(trimmedLine)) {
                        structure.headings.push({
                            text: trimmedLine,
                            page: pageIndex + 1,
                            line: lineIndex
                        });
                    }
                    // リストアイテムの推定
                    else if (this.isLikelyListItem(trimmedLine)) {
                        structure.lists.push({
                            text: trimmedLine,
                            page: pageIndex + 1,
                            line: lineIndex
                        });
                    }
                    // 通常の段落
                    else {
                        structure.paragraphs.push({
                            text: trimmedLine,
                            page: pageIndex + 1,
                            line: lineIndex
                        });
                    }
                });
            });
            
            return structure;
        } catch (error) {
            console.error('PDF structure analysis error:', error);
            return null;
        }
    }

    // 見出しらしい行かどうかを判定
    isLikelyHeading(line) {
        // 短い行（30文字以下）
        if (line.length <= 30) {
            // 数字で始まる、全角文字を含む、句読点で終わらない
            if (/^[\d\.\s]*[^\.\s]/.test(line) || 
                /[^\x01-\x7E]/.test(line) && !line.endsWith('。') && !line.endsWith('、')) {
                return true;
            }
        }
        return false;
    }

    // リストアイテムらしい行かどうかを判定
    isLikelyListItem(line) {
        // 番号付きリスト、箇条書き記号で始まる
        return /^[\s]*[・•·▪▫◦‣⁃]\s/.test(line) ||
               /^[\s]*[\d\w]+[\.\)]\s/.test(line) ||
               /^[\s]*[①-⑳]\s/.test(line);
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFProcessor;
}