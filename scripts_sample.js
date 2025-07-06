function listFiles(event) {
    // console.log("[DEBUG] listFiles called.");
    const files = event.target.files;
    const fileListContainer = document.getElementById("file-list-container");
    fileListContainer.innerHTML = ""; // リストをクリア

    // ファイルリストを配列に変換してソート
    const fileList = Array.from(files).sort((a, b) => {
        const textA = a.webkitRelativePath || a.name;
        const textB = b.webkitRelativePath || b.name;
        return textA.localeCompare(textB);
    });

    // console.log("[DEBUG] Sorted fileList:", fileList.map(f => f.name));

    for (const file of fileList) {
        const listItem = document.createElement("div");
        listItem.className = "file-item";
        
        // ディレクトリ構造を視覚的に表現
        const fullPath = file.webkitRelativePath || file.name;
        const pathParts = fullPath.split('/');
        const indent = Math.max(0, pathParts.length - 1) * 20;
        
        listItem.style.paddingLeft = indent + 'px';
        listItem.style.borderLeft = indent > 0 ? '2px solid #dee2e6' : 'none';
        listItem.style.marginLeft = '5px';
        
        // フルパスを表示するためにfile.webkitRelativePathを使用
        listItem.textContent = fullPath;
        listItem.onclick = () => {
            // console.log("[DEBUG] listItem clicked:", file.name);
            loadFile(file);
        };
        fileListContainer.appendChild(listItem);
    }
}

function loadFile(file) {
    // console.log("[DEBUG] loadFile called with file:", file.name);
    // ▼▼▼ バグ修正：FileReaderを2つ用いるようにし、onloadを上書きしない形へ修正 ▼▼▼
    const reader = new FileReader();
    reader.onload = function (e) {
        // console.log("[DEBUG] Initial FileReader onload for ArrayBuffer:", file.name);
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);

        // ファイルのエンコーディングを検出
        const detectedEncoding = Encoding.detect(uint8Array);
        // console.log("[DEBUG] Detected encoding:", detectedEncoding, "for file:", file.name);

        // 新処理：別のFileReaderを用いてテキスト読み込みを行う
        const readerText = new FileReader();
        readerText.onload = function (e) {
            // console.log("[DEBUG] Second FileReader onload (readAsText):", file.name);
            let fileContent = e.target.result;
            const blocks = fileContent.split("★★★★★");
            // console.log("[DEBUG] File content blocks:", blocks.length, "blocks.");

            document.getElementById("prompt").value = blocks[0] ? blocks[0].trim() : "";
            document.getElementById("description").innerText = blocks[1] ? blocks[1].trim() : "";
            document.getElementById("input-files").innerText = blocks[2] ? blocks[2].trim() : "";
            document.getElementById("selected-file").textContent = file.name;
        };
        readerText.readAsText(file, detectedEncoding);
    };
    reader.onerror = function (err) {
        console.error("[DEBUG] Error in loadFile (ArrayBuffer phase):", err);
    };
    reader.readAsArrayBuffer(file);
    // ▲▲▲ バグ修正ここまで ▲▲▲
}

function dropHandler(event) {
    // console.log("[DEBUG] dropHandler called.");
    event.preventDefault();
    const files = event.dataTransfer.files;
    const droppedFiles = document.getElementById("dropped-files");
    
    // ドロップゾーンのスタイルをリセット
    const dropZone = document.getElementById("drop-zone");
    dropZone.classList.remove("drag-over");
    
    if (files && files.length > 0) {
        // ファイルのみを処理（フォルダは除外）
        processIndividualFiles(files, droppedFiles);
    } else {
        alert("ファイルが見つかりませんでした。フォルダの場合は「フォルダを選択」ボタンをご利用ください。");
    }
}

// ドラッグ&ドロップで個別ファイルのみを処理する関数
function processIndividualFiles(files, container) {
    const fileArray = Array.from(files);
    
    // フォルダが含まれている場合は警告
    const hasDirectoryStructure = fileArray.some(file => 
        file.webkitRelativePath && file.webkitRelativePath.includes('/')
    );
    
    if (hasDirectoryStructure) {
        alert("フォルダ構造が検出されました。フォルダを処理する場合は「フォルダを選択」ボタンをご利用ください。");
        return;
    }
    
    // ファイル名でソート
    fileArray.sort((a, b) => a.name.localeCompare(b.name));
    
    // UIに追加（ファイル名のみ使用）
    fileArray.forEach(file => {
        addFileToDroppedList(file, file.name, container);
    });
}

// 不要になったtraverseFileTree関数は削除

function processFileList(files, container) {
    console.log("[DEBUG] processFileList called with", files.length, "files");
    const fileArray = Array.from(files);
    
    // 各ファイルの詳細をログ出力
    fileArray.forEach((file, index) => {
        console.log(`[DEBUG] File ${index}:`, {
            name: file.name,
            size: file.size,
            type: file.type,
            webkitRelativePath: file.webkitRelativePath
        });
    });
    
    // ファイル名でソート
    fileArray.sort((a, b) => {
        const pathA = a.webkitRelativePath || a.name;
        const pathB = b.webkitRelativePath || b.name;
        return pathA.localeCompare(pathB);
    });
    
    fileArray.forEach(file => {
        const fullPath = file.webkitRelativePath || file.name;
        console.log("[DEBUG] Adding file from FileList:", fullPath);
        addFileToDroppedList(file, fullPath, container);
    });
}

function addFileToDroppedList(file, fullPath, container) {
    console.log("[DEBUG] addFileToDroppedList called for:", fullPath);
    const listItem = document.createElement("div");
    listItem.className = "file-item";
    
    // ディレクトリ構造がある場合のみインデント処理
    const pathParts = fullPath.split('/');
    const indent = Math.max(0, pathParts.length - 1) * 20; // インデント量
    
    if (indent > 0) {
        listItem.style.paddingLeft = indent + 'px';
        listItem.style.borderLeft = '2px solid #dee2e6';
        listItem.style.marginLeft = '5px';
    }
    
    // ファイル名を表示
    listItem.textContent = fullPath;
    listItem.file = file;
    listItem.fullPath = fullPath; // フルパスを保存
    
    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = " [削除]";
    deleteBtn.className = "delete-btn";
    deleteBtn.style.color = "#dc3545";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.onclick = function () {
        console.log("[DEBUG] Delete clicked for:", fullPath);
        container.removeChild(listItem);
    };
    listItem.appendChild(deleteBtn);
    container.appendChild(listItem);
    console.log("[DEBUG] File successfully added to UI:", fullPath);
}

// ディレクトリ選択ボタン用の関数
function handleDirectorySelection(event) {
    console.log("[DEBUG] handleDirectorySelection called");
    const files = event.target.files;
    const droppedFiles = document.getElementById("dropped-files");
    
    if (files && files.length > 0) {
        console.log("[DEBUG] Directory selection: found", files.length, "files");
        processFileList(files, droppedFiles);
    } else {
        console.log("[DEBUG] Directory selection: no files found");
        alert("フォルダが選択されませんでした。");
    }
}

function dragOverHandler(event) {
    event.preventDefault();
    // console.log("[DEBUG] dragOverHandler called.");
    const dropZone = document.getElementById("drop-zone");
    dropZone.classList.add("drag-over");
}

function dragEnterHandler(event) {
    event.preventDefault();
    const dropZone = document.getElementById("drop-zone");
    dropZone.classList.add("drag-over");
}

function dragLeaveHandler(event) {
    event.preventDefault();
    const dropZone = document.getElementById("drop-zone");
    // 要素から完全に離れた場合のみクラスを削除
    if (!dropZone.contains(event.relatedTarget)) {
        dropZone.classList.remove("drag-over");
    }
}

// ▼▼▼ Excel, Word, PDFを判定するための拡張子判定関数 ▼▼▼
function isExcelFile(file) {
    return /\.(xlsx|xls|xlsm)$/i.test(file.name);
}
function isWordFile(file) {
    // 一般的にはdocx解析を想定。docの場合はライブラリで失敗することがあります。
    return /\.(doc|docx)$/i.test(file.name);
}
function isPDFFile(file) {
    return /\.pdf$/i.test(file.name);
}

// ▼▼▼ ★★★ 追加: PowerPointファイルの拡張子判定関数 ★★★
function isPowerPointFile(file) {
    return /\.(ppt|pptx)$/i.test(file.name);
}

// ▼▼▼ 修正版: 図形の中の文言抽出を "async" で行う ▼▼▼

// ★★★ 3-1. JSZipベースの場合に対応するため、asyncで文字列を取り出す関数を新設 ★★★
// ★ (変更前) getStringFromZipFileAsync 内の「unsupported fileObj structure」だった部分を改修
async function getStringFromZipFileAsync(fileObj) {
    if (!fileObj) {
      // console.log("[DEBUG] getStringFromZipFileAsync called with null fileObj.");
      return "";
    }

    // 1) JSZip形式なら async("string") が使えるケース
    if (typeof fileObj.async === "function") {
      // console.log("[DEBUG] getStringFromZipFileAsync: Using fileObj.async('string').");
      try {
        const str = await fileObj.async("string");
        return str;
      } catch (err) {
        console.error("[DEBUG] getStringFromZipFileAsync: Error in async('string')", err);
        return "";
      }
    }

    // 2) asNodeBuffer がある場合 (旧SheetJS構造)
    if (fileObj.asNodeBuffer) {
      // console.log("[DEBUG] getStringFromZipFileAsync: Using asNodeBuffer().");
      const buffer = fileObj.asNodeBuffer();
      return new TextDecoder().decode(buffer);
    }

    // 3) _data.getContent がある場合 (さらに古い構造)
    if (fileObj._data && fileObj._data.getContent) {
      // console.log("[DEBUG] getStringFromZipFileAsync: Using _data.getContent().");
      const buffer = fileObj._data.getContent();
      return new TextDecoder().decode(buffer);
    }

    // 4) ★ 今回の問題パターン: { name, type, content: Uint8Array, ... } の生圧縮データ
    if (fileObj.content && fileObj.content instanceof Uint8Array) {
      // console.log("[DEBUG] getStringFromZipFileAsync: Attempting pako.inflate on fileObj.content.");
      try {
        // pako.inflate で解凍 (バイナリ -> バイナリ)
        const inflated = pako.inflate(fileObj.content);
        // 解凍結果をテキスト化
        const xmlString = new TextDecoder().decode(inflated);
        return xmlString;
      } catch (inflateErr) {
        console.error("[DEBUG] pako.inflate failed. Maybe not compressed or unknown format:", inflateErr);
        // もし失敗したら、「そのままテキスト化」を試す
        // console.log("[DEBUG] Trying direct TextDecoder on raw content...");
        try {
          return new TextDecoder().decode(fileObj.content);
        } catch (decodeErr) {
          console.error("[DEBUG] Direct decode also failed:", decodeErr);
          return "";
        }
      }
    }

    // それでも該当しない場合
    // console.log("[DEBUG] getStringFromZipFileAsync: unsupported fileObj structure. Logging fileObj below:");
    // console.log(fileObj);
    return "";
}

// シート名マップを作成する関数を修正
async function createSheetNameMap(workbook) {
    const sheetNameMap = new Map();
    
    if (!workbook || !workbook.files) return sheetNameMap;
    
    try {
        const workbookFile = workbook.files['xl/workbook.xml'];
        if (!workbookFile) return sheetNameMap;
        
        const xmlString = await getStringFromZipFileAsync(workbookFile);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        
        // シート情報を取得
        const sheets = xmlDoc.getElementsByTagName('sheet');
        for (let i = 0; i < sheets.length; i++) {
            const sheet = sheets[i];
            const sheetName = sheet.getAttribute('name');
            // インデックスを0から始まる番号として使用（i）
            if (sheetName) {
                sheetNameMap.set(String(i), sheetName);
            }
        }
    } catch (err) {
        console.error("[DEBUG] Error creating sheet name map:", err);
    }
    
    return sheetNameMap;
}

// ▼▼▼ 修正版: グループ化対応強化 (Anchor起点に変更) ▼▼▼
function parseShapeXml(xmlString, fileName) {
    const results = []; // { row: number, col: number, text: string } の配列
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // ★★★ 名前空間の定義 (Excel DrawingMLで一般的に使われるもの) ★★★
    const xdrNamespace = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
    const aNamespace = "http://schemas.openxmlformats.org/drawingml/2006/main";
    const vNamespace = "urn:schemas-microsoft-com:vml"; // VML用

    const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
    if (parserError) {
        // console.warn(`XML parse error in ${fileName}:`, parserError.textContent); // デバッグ用ログは維持
        return results; // 空配列を返す
    }

    // --- DrawingML (.xml) のパース ---
    if (fileName.toLowerCase().endsWith('.xml')) {
        // 1. アンカー要素 (twoCellAnchor, oneCellAnchor) をすべて取得
        const twoCellAnchors = xmlDoc.getElementsByTagNameNS(xdrNamespace, "twoCellAnchor");
        const oneCellAnchors = xmlDoc.getElementsByTagNameNS(xdrNamespace, "oneCellAnchor");
        const allAnchors = [...Array.from(twoCellAnchors), ...Array.from(oneCellAnchors)];
        // console.log(`[DEBUG] Found ${allAnchors.length} anchor elements in ${fileName}`);

        // 2. 各アンカー要素を処理
        for (const anchorElement of allAnchors) {
            const anchorType = anchorElement.tagName.toLowerCase().includes('twocell') ? 'twoCell' : 'oneCell';
            // console.log(`[DEBUG] Processing anchor (${anchorType}):`, anchorElement.outerHTML.substring(0, 100));

            // 3. アンカー要素内の図形 (<xdr:sp>) とグループ (<xdr:grpSp>) を再帰的に処理する関数
            const processNode = (node, currentAnchor) => {
                const shapesFound = []; // このノード以下で見つかった { text, node: spElement }

                // 直接の子要素である <xdr:sp> を探す
                // 名前空間プレフィックスを取得 (なければデフォルトを試す)
                const prefix = node.lookupPrefix(xdrNamespace) || 'xdr'; // xdr が一般的だがファイルによる可能性
                const spSelector = `:scope > ${prefix}\\:sp, :scope > sp`; // プレフィックスありとなしを試す
                const directShapes = node.querySelectorAll(spSelector);
                 // console.log(`[DEBUG] Found ${directShapes.length} direct shapes in node:`, node.tagName, `using selector "${spSelector}"`);
                for (const shape of directShapes) {
                     // ★★★ 名前空間を指定して <a:t> 要素を取得 ★★★
                    const tElements = shape.getElementsByTagNameNS(aNamespace, "t");
                    const originalText = Array.from(tElements).map(el => el.textContent).join("");
                    let cleanedText = originalText.replace(/[\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
                    if (cleanedText) {
                         // console.log(`[DEBUG] Found direct shape text: "${cleanedText}"`);
                        shapesFound.push({ text: cleanedText, node: shape });
                    }
                }

                // 直接の子要素である <xdr:grpSp> を探し、再帰処理
                const grpSpSelector = `:scope > ${prefix}\\:grpSp, :scope > grpSp`;
                const groupShapes = node.querySelectorAll(grpSpSelector);
                 // console.log(`[DEBUG] Found ${groupShapes.length} group shapes in node:`, node.tagName, `using selector "${grpSpSelector}"`);
                for (const group of groupShapes) {
                    // console.log(`[DEBUG] Recursively processing group:`, group.tagName);
                    shapesFound.push(...processNode(group, currentAnchor)); // 再帰呼び出し
                }
                return shapesFound;
            };

            // 現在のアンカー要素から処理を開始
            const shapesDataInAnchor = processNode(anchorElement, anchorElement);
             // console.log(`[DEBUG] Found ${shapesDataInAnchor.length} shapes total in anchor (${anchorType})`);

            // 4. 見つかった各図形データに対して座標を取得し、結果に追加
            if (shapesDataInAnchor.length > 0) {
                // アンカー要素から座標情報を取得 (一度だけ行う)
                let row = Infinity, col = Infinity;
                const fromEl = anchorElement.getElementsByTagNameNS(xdrNamespace, "from")[0];
                let fromRow = Infinity, fromCol = Infinity;
                if (fromEl) {
                    const rowEl = fromEl.getElementsByTagNameNS(xdrNamespace, "row")[0];
                    const colEl = fromEl.getElementsByTagNameNS(xdrNamespace, "col")[0];
                    fromRow = parseInt(rowEl?.textContent || Infinity, 10);
                    fromCol = parseInt(colEl?.textContent || Infinity, 10);
                    if (isNaN(fromRow)) fromRow = Infinity;
                    if (isNaN(fromCol)) fromCol = Infinity;
                }

                if (anchorType === 'twoCell') {
                    const toEl = anchorElement.getElementsByTagNameNS(xdrNamespace, "to")[0];
                    let toRow = Infinity, toCol = Infinity;
                    if (toEl) {
                        const rowEl = toEl.getElementsByTagNameNS(xdrNamespace, "row")[0];
                        const colEl = toEl.getElementsByTagNameNS(xdrNamespace, "col")[0];
                        toRow = parseInt(rowEl?.textContent || Infinity, 10);
                        toCol = parseInt(colEl?.textContent || Infinity, 10);
                        if (isNaN(toRow)) toRow = Infinity;
                        if (isNaN(toCol)) toCol = Infinity;
                    }
                    // 中央値を計算
                    if (fromRow !== Infinity && toRow !== Infinity) row = Math.floor((fromRow + toRow) / 2);
                    else row = fromRow;
                    if (fromCol !== Infinity && toCol !== Infinity) col = Math.floor((fromCol + toCol) / 2);
                    else col = fromCol;
                } else { // oneCell
                    row = fromRow;
                    col = fromCol;
                }
                 // console.log(`[DEBUG] Anchor position: row=${row}, col=${col}`);

                // アンカー内で見つかったすべての図形に同じ座標を適用
                for (const shapeData of shapesDataInAnchor) {
                     // console.log(`[DEBUG] Adding result: row=${row}, col=${col}, text="${shapeData.text}"`);
                    results.push({ row, col, text: shapeData.text });
                }
            }
        }
    }
    // --- VML (.vml) のパース --- (変更なし)
    else if (fileName.toLowerCase().endsWith('.vml')) {
        // VMLの名前空間は通常自動で解決されることが多いが、必要なら追加
        const shapeList = xmlDoc.getElementsByTagName("v:shape"); // VMLは名前空間なしでも取得できることが多い
        if (shapeList.length > 0) {
            for (let i = 0; i < shapeList.length; i++) {
                const shape = shapeList[i];
                // テキストボックス要素を探す
                const textBoxList = shape.getElementsByTagName("v:textbox");
                if (textBoxList.length > 0) {
                    for (let j = 0; j < textBoxList.length; j++) {
                        const tb = textBoxList[j];
                        const originalInnerText = tb.textContent;
                        let cleanedInnerText = originalInnerText.replace(/[\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
                        if (cleanedInnerText) {
                            results.push({ row: Infinity, col: Infinity, text: cleanedInnerText });
                        }
                    }
                }
                 // <v:textpath string="..."> も考慮 (図形に沿ったテキストなど)
                 const textPathList = shape.getElementsByTagName("v:textpath");
                 for (let k = 0; k < textPathList.length; k++) {
                     const tp = textPathList[k];
                     const text = tp.getAttribute("string");
                     if (text) {
                         let cleanedText = text.replace(/[\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
                         if (cleanedText) {
                             results.push({ row: Infinity, col: Infinity, text: cleanedText });
                         }
                     }
                 }
            }
        }
    }

    // 重複除去 (最終段階で) - 同じ位置・同じテキストのものを除去
    const uniqueResults = [];
    const seenKeys = new Set();
    for (const item of results) {
        // row, col が Infinity の場合も考慮してキーを作成
        const rowKey = item.row === Infinity ? 'inf' : item.row;
        const colKey = item.col === Infinity ? 'inf' : item.col;
        const key = `${rowKey}-${colKey}-${item.text}`;
        if (!seenKeys.has(key)) {
            uniqueResults.push(item);
            seenKeys.add(key);
        } else {
             // console.log(`[DEBUG] Duplicate shape removed (final stage): ${key}`);
        }
    }

    return uniqueResults; // { row, col, text } の配列を返す
}


// ▼▼▼ 修正版: 図形の中の文言抽出を "async" で行う (Python版の関連付けロジックに寄せた修正) ▼▼▼
async function extractShapeTextFromWorkbookAsync(workbook) {
    const shapesBySheet = new Map(); // キー: シート名, 値: [{ row, col, text }] の配列
    const drawingPathToSheetNameMap = new Map(); // キー: 図形ファイルの絶対パス, 値: シート名
    const sheetNameMapByIndex = new Map(); // キー: シートインデックス(文字列), 値: シート名 (元の createSheetNameMap の結果も保持)
    const sheetRIdToNameMap = new Map(); // キー: シートの rId, 値: シート名
    const sheetRIdToFilePathMap = new Map(); // キー: シートの rId, 値: シートのファイルパス (e.g., xl/worksheets/sheet1.xml)
    const processedDrawingPaths = new Set(); // 処理済みの描画ファイルパスを追跡

    if (!workbook || !workbook.files) return "";

    // ★★★ 名前空間の定義 (XML解析用) ★★★
    const nsR = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    const nsRel = "http://schemas.openxmlformats.org/package/2006/relationships";
    const nsMain = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    const parser = new DOMParser();

    // --- 1. workbook.xml と workbook.xml.rels を解析 ---
    try {
        // 1a. workbook.xml からシート名とrIdを取得
        const workbookFile = workbook.files['xl/workbook.xml'];
        if (workbookFile) {
            const workbookXmlString = await getStringFromZipFileAsync(workbookFile);
            const workbookXmlDoc = parser.parseFromString(workbookXmlString, 'application/xml');
            // ★★★ 名前空間を指定して <sheet> 要素を取得 ★★★
            const sheetNodes = workbookXmlDoc.getElementsByTagNameNS(nsMain, 'sheet');
            for (let i = 0; i < sheetNodes.length; i++) {
                const sheetNode = sheetNodes[i];
                const name = sheetNode.getAttribute('name');
                // ★★★ 名前空間を指定して r:id 属性を取得 ★★★
                const rId = sheetNode.getAttributeNS(nsR, 'id');
                const sheetIndexStr = String(i); // 0始まりのインデックス
                if (name) {
                    sheetNameMapByIndex.set(sheetIndexStr, name); // 元のMapも作成
                    if (rId) {
                        sheetRIdToNameMap.set(rId, name);
                    }
                }
            }
             // console.log("[DEBUG] sheetRIdToNameMap:", sheetRIdToNameMap);
             // console.log("[DEBUG] sheetNameMapByIndex:", sheetNameMapByIndex); // 元のMapもログ出力
        } else {
            console.warn("[DEBUG] xl/workbook.xml not found.");
            // workbook.xml がないとシート名が分からないので、処理継続は難しい場合がある
        }

        // 1b. workbook.xml.rels からシートの rId とファイルパスを取得
        const workbookRelsFile = workbook.files['xl/_rels/workbook.xml.rels'];
        if (workbookRelsFile) {
            const workbookRelsXmlString = await getStringFromZipFileAsync(workbookRelsFile);
            const workbookRelsXmlDoc = parser.parseFromString(workbookRelsXmlString, 'application/xml');
             // ★★★ 名前空間を指定して <Relationship> 要素を取得 ★★★
            const relNodes = workbookRelsXmlDoc.getElementsByTagNameNS(nsRel, 'Relationship');
            for (let i = 0; i < relNodes.length; i++) {
                const relNode = relNodes[i];
                const rId = relNode.getAttribute('Id');
                const target = relNode.getAttribute('Target');
                const type = relNode.getAttribute('Type');
                // シートへのリレーションシップの場合
                if (rId && target && type && type.endsWith('/worksheet')) {
                    // target は "worksheets/sheet1.xml" のような形式
                    // ZIP内の絶対パスに正規化 (先頭に "xl/" をつける)
                    const filePath = resolvePath('xl', target); // resolvePath ヘルパー関数を使用
                    sheetRIdToFilePathMap.set(rId, filePath);
                }
            }
             // console.log("[DEBUG] sheetRIdToFilePathMap:", sheetRIdToFilePathMap);
        } else {
            console.warn("[DEBUG] xl/_rels/workbook.xml.rels not found.");
            // workbook.xml.rels がないとシートファイルパスが分からない
        }

    } catch (err) {
        console.error("[DEBUG] Error parsing workbook or its rels:", err);
        // エラーが発生しても、可能な限り処理を継続することを試みる
    }

    // --- 2. 各シートの rels を解析し、描画ファイルとの関連付けを行う ---
    for (const [rId, sheetFilePath] of sheetRIdToFilePathMap.entries()) {
        const sheetName = sheetRIdToNameMap.get(rId);
        if (!sheetName) {
             // console.log(`[DEBUG] Sheet name not found for rId ${rId}, skipping rels.`);
            continue;
        }

        const sheetDir = sheetFilePath.substring(0, sheetFilePath.lastIndexOf('/')); // 例: xl/worksheets
        const sheetFileName = sheetFilePath.substring(sheetFilePath.lastIndexOf('/') + 1); // 例: sheet1.xml
        const sheetRelsFilePath = `${sheetDir}/_rels/${sheetFileName}.rels`; // 例: xl/worksheets/_rels/sheet1.xml.rels

        const sheetRelsFile = workbook.files[sheetRelsFilePath];
        if (sheetRelsFile) {
            try {
                const sheetRelsXmlString = await getStringFromZipFileAsync(sheetRelsFile);
                const sheetRelsXmlDoc = parser.parseFromString(sheetRelsXmlString, 'application/xml');
                 // ★★★ 名前空間を指定して <Relationship> 要素を取得 ★★★
                const relNodes = sheetRelsXmlDoc.getElementsByTagNameNS(nsRel, 'Relationship');

                for (let i = 0; i < relNodes.length; i++) {
                    const relNode = relNodes[i];
                    const target = relNode.getAttribute('Target');
                    const type = relNode.getAttribute('Type');

                    // 図形ファイル (drawing.xml or vmlDrawing.vml) への参照を探す
                    if (target && type && (type.endsWith('/drawing') || type.endsWith('/vmlDrawing'))) {
                        // target は "../drawings/drawing1.xml" のような形式
                        // 現在のrelsファイルのディレクトリを基準に絶対パスを解決
                        const drawingAbsPath = resolvePath(sheetDir, target); // resolvePath ヘルパー関数を使用
                        const isVml = type.endsWith('/vmlDrawing');

                        // drawing -> sheet_name マップ (drawing優先、VMLは上書きしない)
                        // drawingAbsPath が空文字列や null でないことを確認
                        if (drawingAbsPath && (!drawingPathToSheetNameMap.has(drawingAbsPath) || !isVml)) {
                             drawingPathToSheetNameMap.set(drawingAbsPath, sheetName);
                             // console.log(`[DEBUG] Mapped drawing ${drawingAbsPath} to sheet: ${sheetName}`);
                        } else if (drawingAbsPath && isVml) {
                            // console.log(`[DEBUG] VML ${drawingAbsPath} association skipped (already mapped or drawing exists). Sheet: ${sheetName}`);
                        } else if (!drawingAbsPath) {
                            console.warn(`[DEBUG] Resolved drawing path is invalid for target "${target}" in ${sheetRelsFilePath}`);
                        }
                    }
                }
            } catch (err) {
                console.error(`[DEBUG] Error processing sheet relation file ${sheetRelsFilePath}:`, err);
            }
        } else {
             // console.log(`[DEBUG] Sheet rels file not found: ${sheetRelsFilePath}`);
        }
    }
     // console.log("[DEBUG] drawingPathToSheetNameMap:", drawingPathToSheetNameMap);

    // --- 3. 関連付けられた描画ファイルを処理 ---
    for (const [drawingPath, sheetName] of drawingPathToSheetNameMap.entries()) {
        // drawingPath が有効か再確認
        if (!drawingPath || typeof drawingPath !== 'string') {
             console.warn(`[DEBUG] Invalid drawing path found in map key: ${drawingPath}, skipping.`);
            continue;
        }
        const fileObj = workbook.files[drawingPath];
        if (!fileObj) {
             console.warn(`[DEBUG] Drawing file referenced but not found in zip: ${drawingPath}`);
            continue;
        }
        processedDrawingPaths.add(drawingPath); // 処理済みとしてマーク

        try {
            const xmlString = await getStringFromZipFileAsync(fileObj);
            // parseShapeXml はシート名引数を内部では使っていないので、drawingPathだけでOK
            const parsedShapes = parseShapeXml(xmlString, drawingPath); // { row, col, text } の配列を取得

            if (parsedShapes.length > 0) {
                // console.log(`[DEBUG] Adding ${parsedShapes.length} shapes from ${drawingPath} to sheet: ${sheetName}`);
                if (!shapesBySheet.has(sheetName)) {
                    shapesBySheet.set(sheetName, []);
                }
                shapesBySheet.get(sheetName).push(...parsedShapes);
            }
        } catch (err) {
            console.error(`[DEBUG] Error parsing drawing file ${drawingPath} for sheet ${sheetName}:`, err);
        }
    }

    // --- 4. ZIP内の全描画ファイルをチェックし、未処理なら "不明なシート" へ ---
     // console.log("[DEBUG] Checking for any remaining unassociated drawing files...");
    const allFileNames = Object.keys(workbook.files);
    for (const fileName of allFileNames) {
        // 正規表現で描画ファイルのパスパターンにマッチするかチェック
        // ★★★ パスの区切り文字を / に統一してチェック ★★★
        const normalizedFileName = fileName.replace(/\\/g, '/');
        if (/^xl\/drawings\/(drawing\d+\.xml|vmlDrawing\d+\.vml)$/i.test(normalizedFileName)) {
            if (!processedDrawingPaths.has(normalizedFileName)) { // ★★★ 正規化後のパスでチェック ★★★
                 // console.log(`[DEBUG] Found unprocessed drawing file: ${normalizedFileName}. Assigning to "不明なシート".`);
                const fileObj = workbook.files[fileName]; // 元のファイル名でファイルオブジェクトを取得
                if (!fileObj) continue;

                try {
                    const xmlString = await getStringFromZipFileAsync(fileObj);
                    // parseShapeXml はシート名引数を内部では使っていないので、fileNameだけでOK
                    const parsedShapes = parseShapeXml(xmlString, fileName);
                    if (parsedShapes.length > 0) {
                        const unknownSheetName = "不明なシート";
                        if (!shapesBySheet.has(unknownSheetName)) {
                            shapesBySheet.set(unknownSheetName, []);
                        }
                        shapesBySheet.get(unknownSheetName).push(...parsedShapes);
                        // processedDrawingPaths.add(normalizedFileName); // ここで追加する必要はない
                    }
                } catch (err) {
                     console.error(`[DEBUG] Error processing unassociated drawing file ${fileName}:`, err);
                }
            }
        }
    }


    // --- 5. 全ての drawing ファイルを処理した後、シートごとにグリッド化してテキストを結合 ---
    // (この部分は既存のロジックをほぼ流用し、シート名の順序付けを改善)
    let finalShapeText = "";
    // 取得したシート名の順序を元にソート (workbook.xml の順序)
    const sortedSheetNames = Array.from(sheetNameMapByIndex.values()); // 元のインデックス順マップを使用

    // shapesBySheet に存在するが sortedSheetNames にないシート名（"不明なシート"など）を追加
    const existingSheetNames = new Set(sortedSheetNames);
    for(const sheetName of shapesBySheet.keys()){
        if(!existingSheetNames.has(sheetName)){
            sortedSheetNames.push(sheetName); // 末尾に追加
        }
    }
    // "不明なシート" があれば最後に移動する (もし中間に入っていた場合)
    if (sortedSheetNames.includes("不明なシート")) {
        const index = sortedSheetNames.indexOf("不明なシート");
        if (index !== -1 && index !== sortedSheetNames.length - 1) {
             sortedSheetNames.splice(index, 1); // 一旦削除
             sortedSheetNames.push("不明なシート"); // 末尾に追加
        }
    }


    // ソートされたシート名の順に処理
    for (const sheetName of sortedSheetNames) {
         if (shapesBySheet.has(sheetName)) {
             const shapes = shapesBySheet.get(sheetName);
             // 重複除去ロジック (既存のまま)
             const uniqueShapes = [];
             const seenTexts = new Set();
             shapes.forEach(shape => {
                 // テキストと位置情報で一意性を判断（同一セル内の複数シェイプは別物）
                 const key = `${shape.row}-${shape.col}-${shape.text}`;
                 if (!seenTexts.has(key)) {
                     uniqueShapes.push(shape);
                     seenTexts.add(key);
                 } else {
                      // console.log(`[DEBUG] Duplicate shape text removed: "${shape.text}" at row ${shape.row}, col ${shape.col} on sheet "${sheetName}"`);
                 }
             });

             // グリッド/その他分類 (既存のまま)
             const gridShapes = uniqueShapes.filter(s => s.row !== Infinity && s.col !== Infinity);
             const otherShapes = uniqueShapes.filter(s => s.row === Infinity || s.col === Infinity); // VMLや位置不明なもの

             let sheetGridText = "";
             let otherShapesText = "";

             // グリッド処理 (既存のまま)
             if (gridShapes.length > 0) {
                 // グリッドの最大行・列を計算
                 let maxRow = 0;
                 let maxCol = 0;
                 gridShapes.forEach(s => {
                     maxRow = Math.max(maxRow, s.row);
                     maxCol = Math.max(maxCol, s.col);
                 });

                 // グリッドを初期化 (二次元配列、中身は文字列)
                 const grid = Array(maxRow + 1).fill(null).map(() => Array(maxCol + 1).fill(""));

                 // グリッドにテキストを配置 (同じセルは" "で連結)
                 gridShapes.forEach(s => {
                     if (grid[s.row] && grid[s.row][s.col] !== undefined) {
                         grid[s.row][s.col] += (grid[s.row][s.col] ? " " : "") + s.text;
                     } else {
                          // 配列範囲外などのエラーを防ぐ（基本的には起こらないはずだが念のため）
                          console.warn(`[DEBUG] Shape at invalid grid position skipped: row=${s.row}, col=${s.col}, sheet=${sheetName}`);
                     }
                 });

                 // console.log("[DEBUG] Original grid before slimming:", grid); // デバッグ用ログは維持

                 // 1. 空列判定 (既存のまま)
                 const emptyColumnIndices = new Set();
                 for (let c = 0; c <= maxCol; c++) {
                     let isColEmpty = true;
                     for (let r = 0; r <= maxRow; r++) {
                         // grid[r] が存在し、かつ grid[r][c] が空文字でないことを確認
                         if (grid[r]?.[c] && grid[r][c] !== "") {
                             isColEmpty = false;
                             break;
                         }
                     }
                     if (isColEmpty) {
                         emptyColumnIndices.add(c);
                     }
                 }
                 // console.log("[DEBUG] Empty column indices:", emptyColumnIndices); // デバッグ用ログは維持

                 // 2. グリッドをテキスト化 (空行・空列を削除、行末タブ削除) (既存のまま)
                 let gridContent = "";
                 for (let r = 0; r <= maxRow; r++) {
                     let rowText = "";
                     let rowHasContent = false; // 行に内容があるかフラグ
                     let cellsInRow = []; // この行で実際に出力するセルを一時格納

                     for (let c = 0; c <= maxCol; c++) {
                         // 現在の列が空列でない場合のみ処理
                         if (!emptyColumnIndices.has(c)) {
                             const cellContent = grid[r]?.[c] || "";
                             cellsInRow.push(cellContent); // 空でない列のセル内容を配列に追加
                             // console.log("[DEBUG] cellContent", cellContent, "r=", r, "c=", c); // デバッグ用ログは維持
                             if (cellContent) {
                                  rowHasContent = true; // この行に内容があることを記録
                             }
                         }
                     }

                     // 内容のある行のみ、タブ区切りで結合して結果に追加
                     if (rowHasContent) {
                         rowText = cellsInRow.join("\t"); // 空でない列のセルだけをタブで結合
                         rowText = rowText.replace(/\t+$/, "");
                         gridContent += rowText + "\n";
                     }
                 }

                 // グリッド全体が空でなければ追加 (既存のまま)
                 if (gridContent.trim()) {
                     sheetGridText += `【Shapes in "${sheetName}"】\n${gridContent}\n`; // グリッドの後には改行を1つだけにする
                 } else {
                     // グリッドは存在したが中身がなかった場合
                     sheetGridText = ""; // ヘッダーごと出力しない
                 }
             }

             // VML/その他図形のテキストをリスト化 (既存のまま)
             if (otherShapes.length > 0) {
                 // VMLなども元の出現順に近いように（不安定だが）ソートを試みる
                 otherShapes.sort((a, b) => 0); // 元の配列順を維持
                 // 一意なテキストのみをリスト化
                 const uniqueOtherTexts = [...new Set(otherShapes.map(s => s.text))];
                 if (uniqueOtherTexts.length > 0) {
                     otherShapesText += `【Other Shapes (e.g., VML) in "${sheetName}"】\n`;
                     otherShapesText += uniqueOtherTexts.join("\n") + "\n\n";
                 }
             }

             // シートごとのテキストを結合 (既存のまま)
             if (sheetGridText || otherShapesText) {
                  finalShapeText += sheetGridText + otherShapesText;
             }
         }
    }

    return finalShapeText.trim(); // 末尾の余分な改行を除去
}


// ▼▼▼ ヘルパー関数: パス解決 (簡易版) - 変更なし ▼▼▼
// basePath: 例 "xl/worksheets"
// relativePath: 例 "../drawings/drawing1.xml"
function resolvePath(basePath, relativePath) {
    // 先頭や末尾の / を除去して一貫性を保つ
    basePath = basePath.replace(/^\/+|\/+$/g, '');
    relativePath = relativePath.replace(/^\/+|\/+$/g, '');

    // Windowsパス区切り文字 \ を / に置換
    basePath = basePath.replace(/\\/g, '/');
    relativePath = relativePath.replace(/\\/g, '/');

    const baseParts = basePath.split('/').filter(part => part !== ''); // 空の要素を除去
    const relativeParts = relativePath.split('/');

    // ベースパスがファイルの場合、最後の要素（ファイル名）を削除してディレクトリパスにする
    // 例: xl/worksheets/sheet1.xml -> xl/worksheets
    // ただし、relsファイルからの相対パス解決なので、basePathは常にディレクトリのはず
    // if (basePath.includes('.') && !basePath.endsWith('/')) {
    //     baseParts.pop();
    // }

    let newParts = [...baseParts]; // コピーを作成

    for (const part of relativeParts) {
        if (part === '..') {
            if (newParts.length > 0) {
                newParts.pop(); // 親ディレクトリへ移動 (ルートより上には行かない)
            }
        } else if (part !== '.' && part !== '') {
            newParts.push(part); // サブディレクトリまたはファイル名を追加
        }
    }

    let resolved = newParts.join('/');

    // 絶対パスでない場合 (例: ../../file.xml のような解決結果)、元のrelativePathを返す方が安全かもしれない
    // ここでは単純な結合のみを行う
    // ZIP内のパスは通常 / で始まらないので、先頭の / は不要

    return resolved;
}


// ▼▼▼ 3-3. Excel ファイル読み込みを async 化し、図形内テキストも抽出 ▼▼▼
// ★★★ 改良：空行・空列削除、セル内整形処理、日付フォーマット適用を追加 ★★★
async function readExcelFile(file) {
    // console.log("[DEBUG] readExcelFile called (async):", file.name);
    const data = new Uint8Array(await file.arrayBuffer());
    try {
        // ★★★ 修正点 1: オプションに cellNF: true, cellDates: true を追加 ★★★
        // cellNF: true -> セルの数値書式(zプロパティ)を読み込む
        // cellDates: true -> 日付をDateオブジェクトとして読み込む (cellNFと併用)
        // console.log("[DEBUG] About to XLSX.read (async) ...", file.name);
        const workbook = XLSX.read(data, {
            type: 'array',
            cellComments: true, // メモ取得
            bookFiles: true,    // 図形抽出用
            cellNF: true,       // 数値書式を読み込む
            cellDates: true     // 日付をDateオブジェクトとして読み込む
        });
        // console.log("[DEBUG] XLSX.read complete:", file.name);

        let text = "";
        workbook.SheetNames.forEach(sheetName => {
            // console.log("[DEBUG] Processing sheet:", sheetName);
            const sheet = workbook.Sheets[sheetName];
            const sheetRef = sheet['!ref']; // シートの範囲 (例: "A1:C10")
            let jsonData = []; // フォーマット適用後のデータを格納する配列

            // ★★★ 修正点 2: sheet_to_json の代わりにセルを個別に処理 ★★★
            if (sheetRef) {
                const range = XLSX.utils.decode_range(sheetRef);
                // jsonData を適切なサイズで初期化 (空文字列で埋める)
                jsonData = Array(range.e.r + 1).fill(null).map(() => Array(range.e.c + 1).fill(""));

                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = { c: C, r: R };
                        const cellRef = XLSX.utils.encode_cell(cellAddress);
                        const cell = sheet[cellRef];

                        let cellValue = ""; // デフォルトは空文字列
                        if (cell && cell.v !== undefined) { // セルとその値が存在する場合
                            // cell.w は書式適用済みのテキスト (優先的に使用)
                            // cell.w がない場合、format_cell で書式を適用
                            // format_cell は cellDates:true で読み込んだ日付オブジェクトも適切に処理する
                            cellValue = cell.w || XLSX.utils.format_cell(cell);
                        }

                        // セル内容の前処理 (改行、タブ、連続空白の除去)
                        if (cellValue === null || cellValue === undefined) {
                             cellValue = "";
                         } else {
                             cellValue = String(cellValue); // 文字列に変換
                         }
                        let cleanedCell = cellValue.replace(/[\n\t]+/g, ' ');
                        cleanedCell = cleanedCell.replace(/\s{2,}/g, ' ');
                        cleanedCell = cleanedCell.trim();

                        // ★★★ jsonData の対応する位置に格納 ★★★
                        if (jsonData[R] === undefined) jsonData[R] = []; // 行が存在しない場合初期化(念のため)
                        jsonData[R][C] = cleanedCell;
                    }
                }
                // jsonData の先頭の空行を削除 (SheetJSの範囲は0行目から始まるため)
                // jsonData = jsonData.slice(range.s.r); // A1から始まらないシートの場合、これでいいか要検討 → 下の空行削除で対応

            } else {
                // シートが空か、'!ref'がない場合
                 jsonData = []; // 空のデータとして扱う
            }

            // ★★★ 修正点 3: 空行削除のロジックを調整 ★★★
            // jsonData は既にフォーマット済みテキストの2次元配列になっている
            const processedData = jsonData.filter(row => row && row.some(cell => cell !== "")); // 実質的に空でない行のみを残す

            // --- ここから下の空列削除、TSV化、コメント処理、図形処理は変更なし ---

            // 3. 空列削除
            let finalData = [];
            if (processedData.length > 0) {
                const numCols = Math.max(0, ...processedData.map(row => row ? row.length : 0)); // 最大列数を取得 (空配列の場合も考慮)
                const colsToRemove = new Set();

                for (let j = 0; j < numCols; j++) {
                    let isColEmpty = true;
                    for (let i = 0; i < processedData.length; i++) {
                        if (processedData[i] && processedData[i][j] !== undefined && processedData[i][j] !== "") {
                            isColEmpty = false;
                            break;
                        }
                    }
                    if (isColEmpty) {
                        colsToRemove.add(j);
                    }
                }

                // 空でない列だけを含む新しいデータを作成
                finalData = processedData.map(row => {
                    const newRow = [];
                    if (!row) return newRow; // 行自体がない場合は空行
                    const originalLength = row.length;
                    for (let j = 0; j < numCols; j++) {
                        if (!colsToRemove.has(j)) {
                            newRow.push(j < originalLength && row[j] !== undefined ? row[j] : "");
                        }
                    }
                    return newRow;
                });

                // 再度、空行が発生していないかチェック
                finalData = finalData.filter(row => row && row.some(cell => cell !== ""));
            }


            // 4. 最終的なデータをTSV化
            if (finalData.length > 0) {
                // ★★★ 修正点 4: aoa_to_sheet と sheet_to_csv の代わりに手動でTSV化 ★★★
                let tsv = finalData.map(row => row.join('\t')).join('\n');
                // 行末のタブは join で発生しないはずだが、念のため残しておく
                const lines = tsv.split('\n');
                const trimmedLines = lines.map(line => line.replace(/\t+$/, ''));
                tsv = trimmedLines.join('\n');
                text += `【Sheet: ${sheetName}】\n${tsv}\n\n\n`;
            } else {
                 text += `【Sheet: ${sheetName}】\n(シートは空、または有効なデータがありません)\n\n\n`;
            }

            // シート内のコメントも出力する (変更なし)
            console.log(`[DEBUG] Checking comments for sheet: ${sheetName}`);
            console.log("[DEBUG] sheet['!comments'] object:", sheet["!comments"]);

            if (sheet["!comments"] && Array.isArray(sheet["!comments"]) && sheet["!comments"].length > 0) {
                console.log("[DEBUG] Found comments data in sheet:", sheetName, sheet["!comments"].length);
                text += `【Comments in ${sheetName}】\n`;
                sheet["!comments"].forEach(comment => {
                    console.log("[DEBUG] Processing comment object:", comment);
                    const author = comment.a || "unknown";
                    const originalCommentText = comment.t || "";
                    let cleanedCommentText = originalCommentText.replace(/[\n\t]+/g, ' ');
                    cleanedCommentText = cleanedCommentText.replace(/\s{2,}/g, ' ');
                    cleanedCommentText = cleanedCommentText.trim();
                    if (cleanedCommentText) {
                        const cellRef = comment.ref || "unknown cell";
                        text += `Cell ${cellRef} (by ${author}): ${cleanedCommentText}\n`;
                    } else {
                        console.log(`[DEBUG] Comment text was empty after cleaning for cell ${comment.ref}`);
                    }
                });
                text += "\n";
            } else {
                console.log(`[DEBUG] No comments data found or sheet["!comments"] is not a non-empty array for sheet: ${sheetName}`);
            }
        });

        // 図形(Shapes)の中のテキストを取得（非同期）(変更なし)
        const shapeText = await extractShapeTextFromWorkbookAsync(workbook);
        if (shapeText.trim()) {
            // console.log("[DEBUG] shapeText extracted length:", shapeText.length);
            text += `${shapeText}\n`;
        } else {
            // console.log("[DEBUG] No shapeText extracted.");
        }

        return text;
    } catch (error) {
        console.error("[DEBUG] Error in readExcelFile:", error);
        throw error; // エラーを呼び出し元に伝播させる
    }
}

// ▼▼▼ Word(docx) ファイルのテキストを、できる限りレイアウトを再現して抽出＋図形抽出＋空行削除＋階層インデント ▼▼▼
function readWordFile(file) {
    // console.log("[DEBUG] readWordFile called:", file.name);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function (e) {
            // console.log("[DEBUG] FileReader onload for Word file:", file.name);
            try {
                const arrayBuffer = e.target.result;

                // 1) Mammoth でHTML化（段落・リスト・テーブル・見出しなどをなるべく保持）
                const result = await mammoth.convertToHtml({ arrayBuffer });
                // console.log("[DEBUG] Mammoth convertToHtml success:", file.name);
                let html = result.value || "";

                // 2) HTML を解析してテキスト化（段落/リスト/テーブル/見出し など階層構造をインデント）
                let text = convertMammothHtmlToTextPreserveLayout(html);

                // 3) Word特有の「1行おきに空行」を防ぐため、重複改行を削除
                text = text.replace(/\n\s*\n/g, "\n");

                // 4) docx 内の図形テキストを抽出
                const shapeText = await extractShapesFromDocx(arrayBuffer);
                if (shapeText.trim()) {
                    text += "\n【Shapes in Word】\n" + shapeText + "\n";
                }

                resolve(text);
            } catch (error) {
                console.error("[DEBUG] Error in readWordFile (mammoth or shape extraction):", error);
                reject(error);
            }
        };
        reader.onerror = function (error) {
            console.error("[DEBUG] FileReader error in readWordFile:", error);
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
}

// ▼▼▼ docx の図形抽出用 (Word も zip 構造のためJSZipで drawingsを解析) ▼▼▼
async function extractShapesFromDocx(arrayBuffer) {
    let shapeText = "";
    try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const fileNames = Object.keys(zip.files);
        for (const fileName of fileNames) {
            if (
                /^word\/drawings\/drawing\d+\.xml$/i.test(fileName) ||
                /^word\/drawings\/vmlDrawing\d+\.vml$/i.test(fileName)
            ) {
                // console.log("[DEBUG] Found docx drawing file:", fileName);
                const fileObj = zip.files[fileName];
                if (!fileObj) continue;
                const xmlString = await fileObj.async("string");
                shapeText += parseShapeXml(xmlString, fileName);
            }
        }
    } catch (err) {
        console.error("[DEBUG] Error in extractShapesFromDocx:", err);
    }
    return shapeText;
}

// ▼▼▼ HTML(段落/リスト/テーブル/見出し等)をなるべくテキストとして再現し、階層をインデントする ▼▼▼
function convertMammothHtmlToTextPreserveLayout(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    // 再帰的にノードをたどり、タグ階層を indentLevel で管理する
    function walk(node, indentLevel = 0) {
        let out = "";

        if (node.nodeType === Node.TEXT_NODE) {
            // テキストノードはそのまま返す
            return node.nodeValue;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            switch (tag) {
                // 見出し(h1~h6)はタグに応じたレベルでインデントを変化させる
                case "h1":
                case "h2":
                case "h3":
                case "h4":
                case "h5":
                case "h6": {
                    const headingLevel = parseInt(tag.substring(1), 10);
                    // headingLevel - 1 でインデント幅を決定
                    const headingIndent = headingLevel - 1;
                    const content = Array.from(node.childNodes).map(n => walk(n, headingIndent)).join("").trim();
                    // 見出し前に改行を入れ、インデントして出力、さらに改行
                    out += "\n" + getIndentStr(headingIndent) + content + "\n";
                    break;
                }
                case "p": {
                    // 段落
                    const content = Array.from(node.childNodes).map(n => walk(n, indentLevel)).join("");
                    out += getIndentStr(indentLevel) + content + "\n";
                    break;
                }
                case "br":
                    out += "\n";
                    break;
                case "ul":
                case "ol": {
                    // リストの場合、子要素(li)は indentLevel+1
                    const children = Array.from(node.childNodes).map(n => walk(n, indentLevel + 1)).join("");
                    out += children;
                    out += "\n"; // リスト全体の後ろで改行
                    break;
                }
                case "li": {
                    // リスト項目。深い階層はさらにインデント
                    const content = Array.from(node.childNodes).map(n => walk(n, indentLevel)).join("");
                    out += getIndentStr(indentLevel) + "• " + content + "\n";
                    break;
                }
                case "table": {
                    // テーブル
                    const children = Array.from(node.childNodes).map(n => walk(n, indentLevel)).join("");
                    out += children + "\n";
                    break;
                }
                case "tr": {
                    // 行
                    // 各セルを | で区切って1行に
                    const cells = Array.from(node.children).map((cell) => walk(cell, indentLevel).trim());
                    out += getIndentStr(indentLevel) + cells.join(" | ") + "\n";
                    break;
                }
                case "td":
                case "th": {
                    // セル内の要素を連結
                    const content = Array.from(node.childNodes).map(n => walk(n, indentLevel)).join("");
                    out += content;
                    break;
                }
                default: {
                    // その他のタグ (span, strong, em, div, 等) は子要素を再帰処理
                    const content = Array.from(node.childNodes).map(n => walk(n, indentLevel)).join("");
                    out += content;
                    break;
                }
            }
        }
        return out;
    }

    function getIndentStr(level) {
        // インデント幅はレベル × 2スペース程度
        return "  ".repeat(level);
    }

    return walk(doc.body, 0).trim();
}

// PDF ファイルのテキストを抽出（PDFの元レイアウトを反映するよう改良）
function extractPDF(file) {
    // console.log("[DEBUG] extractPDF called:", file.name);
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            // console.log("[DEBUG] FileReader onload for PDF file:", file.name);
            const typedarray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                // console.log("[DEBUG] PDF loaded. numPages:", pdf.numPages, "File:", file.name);
                const maxPages = pdf.numPages;
                const pageTextPromises = [];
                for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                    pageTextPromises.push(
                        pdf.getPage(pageNum).then(page => {
                            return page.getTextContent().then(textContent => {
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
                                let lines = [];
                                let currentLine = [];
                                let currentY = null;
                                textItems.forEach(item => {
                                    const itemY = item.transform[5];
                                    if (currentY === null || Math.abs(itemY - currentY) < 5) {
                                        currentLine.push(item);
                                        if (currentY === null) currentY = itemY;
                                    } else {
                                        // 現在の行内をX座標でソート（昇順）して連結
                                        currentLine.sort((a, b) => a.transform[4] - b.transform[4]);
                                        let lineText = "";
                                        for (let i = 0; i < currentLine.length; i++) {
                                            if (i > 0) {
                                                const prevItem = currentLine[i - 1];
                                                const gap = currentLine[i].transform[4] - (prevItem.transform[4] + (prevItem.width || 0));
                                                if (gap > 5) {
                                                    const numSpaces = Math.max(1, Math.floor(gap / 5));
                                                    lineText += " ".repeat(numSpaces);
                                                }
                                            }
                                            lineText += currentLine[i].str;
                                        }
                                        lines.push(lineText);
                                        // 新しい行の開始
                                        currentLine = [item];
                                        currentY = itemY;
                                    }
                                });
                                // 残った最後の行を処理
                                if (currentLine.length > 0) {
                                    currentLine.sort((a, b) => a.transform[4] - b.transform[4]);
                                    let lineText = "";
                                    for (let i = 0; i < currentLine.length; i++) {
                                        if (i > 0) {
                                            const prevItem = currentLine[i - 1];
                                            const gap = currentLine[i].transform[4] - (prevItem.transform[4] + (prevItem.width || 0));
                                            if (gap > 5) {
                                                const numSpaces = Math.max(1, Math.floor(gap / 5));
                                                lineText += " ".repeat(numSpaces);
                                            }
                                        }
                                        lineText += currentLine[i].str;
                                    }
                                    lines.push(lineText);
                                }
                                // 行ごとに改行文字で連結してページのテキストとする
                                return lines.join("\n");
                            });
                        })
                    );
                }
                Promise.all(pageTextPromises).then(pagesText => {
                    // ページ間はダブル改行で区切る
                    const fullText = pagesText.join("\n\n");
                    // console.log("[DEBUG] PDF text extraction finished:", file.name);
                    resolve(fullText);
                }).catch(err => {
                    console.error("[DEBUG] Error in pageTextPromises:", err);
                    reject(err);
                });
            }).catch(err => {
                console.error("[DEBUG] Error in pdfjsLib.getDocument:", err);
                reject(err);
            });
        };
        fileReader.onerror = function (error) {
            console.error("[DEBUG] FileReader error in extractPDF:", error);
            reject(error);
        };
        fileReader.readAsArrayBuffer(file);
    });
}

// ▼▼▼ ★★★ 追加: PowerPointファイルの読み込み処理 (ppt / pptx) ★★★ ▼▼▼
function readPowerPointFile(file) {
    // console.log("[DEBUG] readPowerPointFile called:", file.name);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            // console.log("[DEBUG] FileReader onload for PowerPoint file:", file.name);
            try {
                const arrayBuffer = e.target.result;
                const zip = await JSZip.loadAsync(arrayBuffer);

                // スライド・ノートのテキストを抽出
                let text = await extractSlidesAndNotesFromPptx(zip);

                // 図形のテキストを抽出
                const shapeText = await extractShapesFromPptx(zip);
                if (shapeText.trim()) {
                    text += "\n【Shapes in PowerPoint】\n" + shapeText + "\n";
                }

                resolve(text);
            } catch (err) {
                console.error("[DEBUG] readPowerPointFile error:", err);
                reject(err);
            }
        };
        reader.onerror = function (error) {
            console.error("[DEBUG] FileReader error in readPowerPointFile:", error);
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    });
}

async function extractSlidesAndNotesFromPptx(zip) {
    let text = "";
    const fileNames = Object.keys(zip.files);

    // スライド (ppt/slides/slideN.xml)
    const slideFileNames = fileNames.filter(fn => /^ppt\/slides\/slide\d+\.xml$/i.test(fn));
    for (const fileName of slideFileNames) {
        const fileObj = zip.files[fileName];
        if (!fileObj) continue;
        const xmlString = await fileObj.async("string");
        const slideText = parseSlideXml(xmlString, fileName);
        if (slideText.trim()) {
            text += `【Slide: ${fileName}】\n${slideText}\n\n`;
        }
    }

    // ノート (ppt/notesSlides/notesSlideN.xml)
    const notesFileNames = fileNames.filter(fn => /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(fn));
    for (const fileName of notesFileNames) {
        const fileObj = zip.files[fileName];
        if (!fileObj) continue;
        const xmlString = await fileObj.async("string");
        const notesText = parseSlideXml(xmlString, fileName);
        if (notesText.trim()) {
            text += `【Notes: ${fileName}】\n${notesText}\n\n`;
        }
    }

    return text;
}

function parseSlideXml(xmlString, fileName) {
    let result = "";
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.warn(`XML parse error in ${fileName}`);
        return result;
    }

    // <a:t> 要素を抽出
    const aTList = xmlDoc.getElementsByTagName("a:t");
    for (let i = 0; i < aTList.length; i++) {
        const text = aTList[i].textContent;
        if (text.trim()) {
            // console.log("[DEBUG] text:", text);
            result += text + "\n";
        }
    }
    return result;
}

async function extractShapesFromPptx(zip) {
    let shapeText = "";
    try {
        const fileNames = Object.keys(zip.files);
        for (const fileName of fileNames) {
            if (
                /^ppt\/drawings\/drawing\d+\.xml$/i.test(fileName) ||
                /^ppt\/drawings\/vmlDrawing\d+\.vml$/i.test(fileName)
            ) {
                // console.log("[DEBUG] Found ppt drawing file:", fileName);
                const fileObj = zip.files[fileName];
                if (!fileObj) continue;
                const xmlString = await fileObj.async("string");
                shapeText += parseShapeXml(xmlString, fileName);
            }
        }
    } catch (err) {
        console.error("[DEBUG] Error in extractShapesFromPptx:", err);
    }
    return shapeText;
}

// ▼▼▼ copyToClipboard: ドロップされたファイルの読込結果をすべて連結してコピー ▼▼▼
function copyToClipboard() {
    console.log("[DEBUG] copyToClipboard called.");

    const content = document.getElementById("prompt").value;
    console.log("[DEBUG] Prompt content length:", content.length);
    
    // ●●●が含まれる場合は処理を中止
    if (content.includes("●●●")) {
        alert("プロンプトの「●●●」の部分を書き換えてください。");
        return;
    }
    const allContent = [content];
    const droppedFiles = document.querySelectorAll("#dropped-files .file-item");
    let filesToRead = droppedFiles.length;
    console.log("[DEBUG] droppedFiles found:", droppedFiles.length);
    console.log("[DEBUG] filesToRead:", filesToRead);

    if (filesToRead === 0) {
        console.log("[DEBUG] No dropped files, copying only the prompt.");
        copyText(allContent.join("\n"));
    } else {
        console.log("[DEBUG] Processing", filesToRead, "dropped files...");
        droppedFiles.forEach((item) => {
            const file = item.file;
            const filePath = item.fullPath || file.name; // ディレクトリ構造を含むファイル名を使用
            // console.log("[DEBUG] Processing dropped file:", filePath);

            // ▼▼▼ 拡張子別に処理を振り分け ▼▼▼
            if (isExcelFile(file)) {
                // console.log("[DEBUG] Detected Excel file:", filePath);
                readExcelFile(file).then((fileContent) => {
                    allContent.push("");
                    allContent.push(`${filePath}`);
                    allContent.push("");
                    allContent.push(fileContent);
                    filesToRead--;
                    // console.log("[DEBUG] Excel done, remaining:", filesToRead);
                    if (filesToRead === 0) {
                        // console.log("[DEBUG] All files done. Copy to clipboard now.");
                        copyText(allContent.join("\n"));
                    }
                }).catch(e => {
                    console.error("[DEBUG] readExcelFile error:", e);
                    filesToRead--;
                    if (filesToRead === 0) {
                        copyText(allContent.join("\n"));
                    }
                });
            } else if (isWordFile(file)) {
                // console.log("[DEBUG] Detected Word file:", filePath);
                readWordFile(file).then((fileContent) => {
                    allContent.push("");
                    allContent.push(`${filePath}`);
                    allContent.push("");
                    allContent.push(fileContent);
                    filesToRead--;
                    // console.log("[DEBUG] Word done, remaining:", filesToRead);
                    if (filesToRead === 0) {
                        copyText(allContent.join("\n"));
                    }
                }).catch(e => {
                    console.error("[DEBUG] readWordFile error:", e);
                    filesToRead--;
                    if (filesToRead === 0) {
                        copyText(allContent.join("\n"));
                    }
                });
            } else if (isPDFFile(file)) {
                // console.log("[DEBUG] Detected PDF file:", filePath);
                extractPDF(file).then((fileContent) => {
                    allContent.push("");
                    allContent.push(`${filePath}`);
                    allContent.push("");
                    allContent.push(fileContent);
                    filesToRead--;
                    // console.log("[DEBUG] PDF done, remaining:", filesToRead);
                    if (filesToRead === 0) {
                        copyText(allContent.join("\n"));
                    }
                }).catch(e => {
                    console.error("[DEBUG] extractPDF error:", e);
                    filesToRead--;
                    if (filesToRead === 0) {
                        copyText(allContent.join("\n"));
                    }
                });
            // ▼▼▼ ★★★ 追加: PowerPointファイルの場合 ★★★
            } else if (isPowerPointFile(file)) {
                // console.log("[DEBUG] Detected PowerPoint file:", filePath);
                readPowerPointFile(file).then((fileContent) => {
                    allContent.push("");
                    allContent.push(`${filePath}`);
                    allContent.push("");
                    allContent.push(fileContent);
                    filesToRead--;
                    // console.log("[DEBUG] PowerPoint done, remaining:", filesToRead);
                    if (filesToRead === 0) {
                        copyText(allContent.join("\n"));
                    }
                }).catch(e => {
                    console.error("[DEBUG] readPowerPointFile error:", e);
                    filesToRead--;
                    if (filesToRead === 0) {
                        copyText(allContent.join("\n"));
                    }
                });
            } else {
                // console.log("[DEBUG] Detected text/other file:", filePath);
                // ▼▼▼ 既存のテキストファイル読み取り処理はそのまま ▼▼▼
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = function (e) {
                    // console.log("[DEBUG] TextFile ArrayBuffer loaded:", filePath);
                    const arrayBuffer = e.target.result;
                    const uint8Array = new Uint8Array(arrayBuffer);

                    // ファイルのエンコーディングを検出
                    const detectedEncoding = Encoding.detect(uint8Array);
                    // console.log("[DEBUG] Detected encoding (text file):", detectedEncoding, filePath);

                    reader.readAsText(file, detectedEncoding);
                    reader.onload = function (e) {
                        // console.log("[DEBUG] textFile readAsText complete:", filePath);
                        let fileContent = e.target.result;
                        // ファイルパスを追加
                        allContent.push("");
                        allContent.push(`${filePath}`); // ディレクトリ構造を含むフルパス
                        allContent.push("");
                        allContent.push(fileContent);
                        filesToRead--;
                        // console.log("[DEBUG] Text file done, remaining:", filesToRead);
                        if (filesToRead === 0) {
                            copyText(allContent.join("\n"));
                        }
                    };
                };
                reader.onerror = function (err) {
                    console.error("[DEBUG] Error reading text/other file:", err);
                    filesToRead--;
                    if (filesToRead === 0) {
                        copyText(allContent.join("\n"));
                    }
                };
            }
        });
    }
}

// ▼▼▼ copyText: テキストをクリップボードにコピーし、Chat AI を開く ▼▼▼
function copyText(text) {
    console.log("[DEBUG] copyText called. Input text length:", text.length);
    
    // 生成されるプロンプトの冒頭に「今日の日付:YYYY/MM/DD」を出力する
    //const now = new Date();
    //const year = now.getFullYear();
    //const month = ("0" + (now.getMonth() + 1)).slice(-2);
    //const day = ("0" + now.getDate()).slice(-2);
    //const currentDate = `${year}/${month}/${day}`;
    
    //const header = `今日の日付:${currentDate}\n`;
    const header = "";
    const footer = `\n\n以上がインプット情報です。冒頭の指示に従ってください。\n\n`;
    let finalText = header + text + footer;

    // ▼▼▼ ここから追加：ハードコーディングされた置換処理 ▼▼▼
    const replacements = [
        { before: "置換前ワード1", after: "置換後ワード1" },
        { before: "置換前ワード2", after: "置換後ワード2" }
        // 必要な分だけ追加
    ];
    for (const { before, after } of replacements) {
        // 全ての出現箇所を置換
        finalText = finalText.split(before).join(after);
    }
    // ▲▲▲ 置換処理ここまで ▲▲▲

    console.log("[DEBUG] Final text length:", finalText.length);
    console.log("[DEBUG] Attempting to copy to clipboard...");
    
    navigator.clipboard.writeText(finalText).then(
        function () {
            console.log("[DEBUG] Successfully copied text to clipboard. Opening Chat AI.");
            alert("クリップボードにコピーしました！Chat AIを開きます。");
            window.open("https://v2.scsk-gai.jp/c/new", "_blank");
        },
        function (error) {
            console.error("[DEBUG] Failed to copy to clipboard:", error);
            alert("コピーに失敗しました！");
        }
    );
}

// ▼▼▼ クリアボタンで初期化 ▼▼▼
function clearAll() {
    document.getElementById("prompt").value = "";
    document.getElementById("description").innerText = "";
    document.getElementById("input-files").innerText = "";
    document.getElementById("selected-file").textContent = "";
    const droppedFiles = document.getElementById("dropped-files");
    while (droppedFiles.firstChild) {
        droppedFiles.removeChild(droppedFiles.firstChild);
    }
}

// ページ読み込み時に./prompt/ディレクトリのファイル一覧を自動的に読み込む
async function loadPromptDirectory() {
    console.log("[DEBUG] Attempting to load ./prompt/ directory automatically");
    
    try {
        // File System Access APIを試行
        if ('showDirectoryPicker' in window) {
            // ブラウザがFile System Access APIをサポートしている場合
            // ただし、自動実行はできないため、代替案を使用
            console.log("[DEBUG] File System Access API is available, but auto-access not possible");
        }
        
        // XMLHttpRequestを使って./prompt/ディレクトリ内のファイル一覧を取得を試行
        // ただし、セキュリティ制限により直接ディレクトリアクセスは不可能
        // 代わりに、既知のファイル名をチェックする方法を使用
        
        const knownFiles = [
            '事業計画プロンプト.txt'
        ];
        
        // 新しいフォルダー内のファイルも確認
        const subDirFiles = [
            '新しいフォルダー/test1.txt',
            '新しいフォルダー/test2.txt'
        ];
        
        const fileListContainer = document.getElementById("file-list-container");
        fileListContainer.innerHTML = ""; // リストをクリア
        
        // 既知のファイルの存在を確認
        const allFiles = [...knownFiles, ...subDirFiles];
        
        for (const fileName of allFiles) {
            try {
                const response = await fetch(`./prompt/${fileName}`);
                if (response.ok) {
                    console.log(`[DEBUG] Found file: ${fileName}`);
                    
                    // ファイルアイテムを作成
                    const listItem = document.createElement("div");
                    listItem.className = "file-item";
                    
                    // ディレクトリ構造を視覚的に表現
                    const pathParts = fileName.split('/');
                    const indent = Math.max(0, pathParts.length - 1) * 20;
                    
                    if (indent > 0) {
                        listItem.style.paddingLeft = indent + 'px';
                        listItem.style.borderLeft = '2px solid #dee2e6';
                        listItem.style.marginLeft = '5px';
                    }
                    
                    listItem.textContent = fileName;
                    
                    // ファイルをクリックしたときの処理
                    listItem.onclick = async () => {
                        try {
                            const fileResponse = await fetch(`./prompt/${fileName}`);
                            const text = await fileResponse.text();
                            
                            // ファイル内容を疑似Fileオブジェクトとして作成
                            const blob = new Blob([text], { type: 'text/plain' });
                            const file = new File([blob], fileName, { type: 'text/plain' });
                            
                            loadFile(file);
                        } catch (error) {
                            console.error(`[DEBUG] Error loading file ${fileName}:`, error);
                        }
                    };
                    
                    fileListContainer.appendChild(listItem);
                } else {
                    console.log(`[DEBUG] File not found: ${fileName}`);
                }
            } catch (error) {
                console.log(`[DEBUG] Could not check file ${fileName}:`, error);
            }
        }
        
        if (fileListContainer.children.length === 0) {
            // ファイルが見つからない場合のメッセージ
            const noFilesMessage = document.createElement("div");
            noFilesMessage.className = "text-muted small";
            noFilesMessage.textContent = "ファイルが見つかりません。手動でフォルダを選択してください。";
            fileListContainer.appendChild(noFilesMessage);
        }
        
    } catch (error) {
        console.error("[DEBUG] Error in loadPromptDirectory:", error);
        
        // エラー時のメッセージ
        const fileListContainer = document.getElementById("file-list-container");
        const errorMessage = document.createElement("div");
        errorMessage.className = "text-muted small";
        errorMessage.textContent = "自動読み込みに失敗しました。手動でフォルダを選択してください。";
        fileListContainer.appendChild(errorMessage);
    }
}

// より良い方法：サーバーサイドでディレクトリ一覧を提供するか、
// 既知のファイル一覧を動的に取得する機能を追加
async function loadPromptDirectoryAdvanced() {
    console.log("[DEBUG] Attempting advanced prompt directory loading");
    
    try {
        // サーバーサイドでファイル一覧を提供するエンドポイントを試行
        const response = await fetch('./prompt-files.json');
        if (response.ok) {
            const fileList = await response.json();
            console.log("[DEBUG] Got file list from server:", fileList);
            
            const fileListContainer = document.getElementById("file-list-container");
            fileListContainer.innerHTML = "";
            
            for (const fileName of fileList) {
                const listItem = document.createElement("div");
                listItem.className = "file-item";
                
                // ディレクトリ構造を視覚的に表現
                const pathParts = fileName.split('/');
                const indent = Math.max(0, pathParts.length - 1) * 20;
                
                if (indent > 0) {
                    listItem.style.paddingLeft = indent + 'px';
                    listItem.style.borderLeft = '2px solid #dee2e6';
                    listItem.style.marginLeft = '5px';
                }
                
                listItem.textContent = fileName;
                
                listItem.onclick = async () => {
                    try {
                        const fileResponse = await fetch(`./prompt/${fileName}`);
                        const text = await fileResponse.text();
                        
                        const blob = new Blob([text], { type: 'text/plain' });
                        const file = new File([blob], fileName, { type: 'text/plain' });
                        
                        loadFile(file);
                    } catch (error) {
                        console.error(`[DEBUG] Error loading file ${fileName}:`, error);
                    }
                };
                
                fileListContainer.appendChild(listItem);
            }
        } else {
            // JSON ファイルが存在しない場合は基本的な方法にフォールバック
            await loadPromptDirectory();
        }
    } catch (error) {
        console.log("[DEBUG] Advanced loading failed, falling back to basic method");
        await loadPromptDirectory();
    }
}

// ページ読み込み完了時に実行
document.addEventListener('DOMContentLoaded', function() {
    console.log("[DEBUG] DOM loaded, attempting to load prompt directory");
    loadPromptDirectoryAdvanced();
});

// 念のため、windowロード完了時にも実行
window.addEventListener('load', function() {
    console.log("[DEBUG] Window loaded, checking if prompt directory was loaded");
    const fileListContainer = document.getElementById("file-list-container");
    if (fileListContainer.children.length === 0) {
        console.log("[DEBUG] No files loaded yet, retrying...");
        loadPromptDirectoryAdvanced();
    }
});
