// AI審査員システム - PowerPoint処理ユーティリティ (scripts_sample.jsから移植)

class PowerPointProcessor {
    constructor() {
        // JSZipライブラリが利用可能かチェック
        this.isAvailable = typeof JSZip !== 'undefined';
        if (!this.isAvailable) {
            console.warn('JSZip library not found. PowerPoint processing will be limited.');
        }
    }

    // PowerPointファイルからテキストを抽出
    async extractTextFromPowerPoint(file) {
        if (!this.isAvailable) {
            throw new Error('JSZip library is not available');
        }

        try {
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const zip = await JSZip.loadAsync(arrayBuffer);
            
            // スライドとノートのテキストを抽出
            const slidesText = await this.extractSlidesAndNotes(zip);
            
            // 図形のテキストを抽出
            const shapesText = await this.extractShapes(zip);
            
            let fullText = slidesText;
            if (shapesText.trim()) {
                fullText += '\n\n【図形・テキストボックス】\n' + shapesText;
            }
            
            return {
                text: fullText,
                slides: await this.getSlideInfo(zip),
                metadata: await this.extractMetadata(zip)
            };
        } catch (error) {
            console.error('PowerPoint processing error:', error);
            throw new Error(`PowerPoint処理エラー: ${error.message}`);
        }
    }

    // ファイルをArrayBufferとして読み込み
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
            reader.readAsArrayBuffer(file);
        });
    }

    // スライドとノートのテキストを抽出
    async extractSlidesAndNotes(zip) {
        let text = '';
        const fileNames = Object.keys(zip.files);
        
        // スライド (ppt/slides/slideN.xml)
        const slideFileNames = fileNames
            .filter(fn => /^ppt\/slides\/slide\d+\.xml$/i.test(fn))
            .sort((a, b) => {
                const numA = parseInt(a.match(/slide(\d+)\.xml$/i)[1]);
                const numB = parseInt(b.match(/slide(\d+)\.xml$/i)[1]);
                return numA - numB;
            });
            
        for (const fileName of slideFileNames) {
            const slideNumber = fileName.match(/slide(\d+)\.xml$/i)[1];
            const fileObj = zip.files[fileName];
            if (!fileObj) continue;
            
            const xmlString = await fileObj.async('string');
            const slideText = this.parseSlideXml(xmlString);
            
            if (slideText.trim()) {
                text += `\n【スライド ${slideNumber}】\n${slideText}\n`;
            }
        }
        
        // ノート (ppt/notesSlides/notesSlideN.xml)
        const notesFileNames = fileNames
            .filter(fn => /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(fn))
            .sort((a, b) => {
                const numA = parseInt(a.match(/notesSlide(\d+)\.xml$/i)[1]);
                const numB = parseInt(b.match(/notesSlide(\d+)\.xml$/i)[1]);
                return numA - numB;
            });
            
        for (const fileName of notesFileNames) {
            const slideNumber = fileName.match(/notesSlide(\d+)\.xml$/i)[1];
            const fileObj = zip.files[fileName];
            if (!fileObj) continue;
            
            const xmlString = await fileObj.async('string');
            const notesText = this.parseSlideXml(xmlString);
            
            if (notesText.trim()) {
                text += `\n【スライド ${slideNumber} - ノート】\n${notesText}\n`;
            }
        }
        
        return text;
    }

    // スライドXMLからテキストを抽出
    parseSlideXml(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            console.warn('XML parse error in slide');
            return '';
        }
        
        // <a:t> 要素からテキストを抽出
        const textElements = xmlDoc.getElementsByTagName('a:t');
        const texts = [];
        
        for (let i = 0; i < textElements.length; i++) {
            const text = textElements[i].textContent.trim();
            if (text) {
                texts.push(text);
            }
        }
        
        return texts.join('\n');
    }

    // 図形からテキストを抽出
    async extractShapes(zip) {
        let shapesText = '';
        const fileNames = Object.keys(zip.files);
        
        // 図形ファイルを検索
        for (const fileName of fileNames) {
            if (/^ppt\/drawings\/(drawing\d+\.xml|vmlDrawing\d+\.vml)$/i.test(fileName)) {
                const fileObj = zip.files[fileName];
                if (!fileObj) continue;
                
                const xmlString = await fileObj.async('string');
                const shapeText = this.parseShapeXml(xmlString, fileName);
                
                if (shapeText.trim()) {
                    shapesText += shapeText + '\n';
                }
            }
        }
        
        return shapesText;
    }

    // 図形XMLからテキストを抽出（scripts_sample.jsのparseShapeXmlを簡略化）
    parseShapeXml(xmlString, fileName) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            return '';
        }
        
        const texts = [];
        
        // DrawingML (.xml) の場合
        if (fileName.toLowerCase().endsWith('.xml')) {
            const aNamespace = 'http://schemas.openxmlformats.org/drawingml/2006/main';
            const tElements = xmlDoc.getElementsByTagNameNS(aNamespace, 't');
            
            for (let i = 0; i < tElements.length; i++) {
                const text = tElements[i].textContent.trim();
                if (text) {
                    texts.push(text);
                }
            }
        }
        // VML (.vml) の場合
        else if (fileName.toLowerCase().endsWith('.vml')) {
            const textBoxes = xmlDoc.getElementsByTagName('v:textbox');
            for (let i = 0; i < textBoxes.length; i++) {
                const text = textBoxes[i].textContent.trim();
                if (text) {
                    texts.push(text);
                }
            }
            
            const textPaths = xmlDoc.getElementsByTagName('v:textpath');
            for (let i = 0; i < textPaths.length; i++) {
                const text = textPaths[i].getAttribute('string');
                if (text && text.trim()) {
                    texts.push(text.trim());
                }
            }
        }
        
        return texts.join('\n');
    }

    // スライド情報を取得
    async getSlideInfo(zip) {
        const slides = [];
        const fileNames = Object.keys(zip.files);
        
        const slideFileNames = fileNames
            .filter(fn => /^ppt\/slides\/slide\d+\.xml$/i.test(fn))
            .sort();
            
        for (const fileName of slideFileNames) {
            const slideNumber = parseInt(fileName.match(/slide(\d+)\.xml$/i)[1]);
            slides.push({
                number: slideNumber,
                fileName: fileName
            });
        }
        
        return slides;
    }

    // メタデータを抽出
    async extractMetadata(zip) {
        const metadata = {
            title: '',
            author: '',
            created: '',
            modified: '',
            slideCount: 0
        };
        
        try {
            // core.xmlからメタデータを取得
            const coreFile = zip.files['docProps/core.xml'];
            if (coreFile) {
                const xmlString = await coreFile.async('string');
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
                
                const titleElement = xmlDoc.getElementsByTagName('dc:title')[0];
                if (titleElement) {
                    metadata.title = titleElement.textContent;
                }
                
                const creatorElement = xmlDoc.getElementsByTagName('dc:creator')[0];
                if (creatorElement) {
                    metadata.author = creatorElement.textContent;
                }
                
                const createdElement = xmlDoc.getElementsByTagName('dcterms:created')[0];
                if (createdElement) {
                    metadata.created = createdElement.textContent;
                }
                
                const modifiedElement = xmlDoc.getElementsByTagName('dcterms:modified')[0];
                if (modifiedElement) {
                    metadata.modified = modifiedElement.textContent;
                }
            }
            
            // スライド数を計算
            const slideFiles = Object.keys(zip.files).filter(fn => 
                /^ppt\/slides\/slide\d+\.xml$/i.test(fn)
            );
            metadata.slideCount = slideFiles.length;
            
        } catch (error) {
            console.warn('Metadata extraction failed:', error);
        }
        
        return metadata;
    }

    // PowerPointファイルの構造を解析
    async analyzeStructure(file) {
        try {
            const result = await this.extractTextFromPowerPoint(file);
            
            return {
                slideCount: result.metadata.slideCount,
                hasNotes: result.text.includes('【スライド') && result.text.includes('- ノート】'),
                hasShapes: result.text.includes('【図形・テキストボックス】'),
                title: result.metadata.title || 'タイトル未設定',
                author: result.metadata.author || '作成者未設定'
            };
        } catch (error) {
            console.error('PowerPoint structure analysis error:', error);
            return null;
        }
    }

    // PPTとPPTXの判定
    isPPTX(file) {
        return file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
               /\.pptx$/i.test(file.name);
    }

    isPPT(file) {
        return file.type === 'application/vnd.ms-powerpoint' ||
               /\.ppt$/i.test(file.name);
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerPointProcessor;
}