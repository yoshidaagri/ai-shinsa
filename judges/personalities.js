// AI審査員システム - 審査員パーソナリティ定義

// コンテンツ適応型質問生成フレームワーク
const CONTENT_ANALYSIS_FRAMEWORK = {
    
    // Step 1: コンテンツ分析
    analyzeContent: function(slideContent, audioContent) {
        const analysis = {
            socialIssue: this.extractSocialIssue(slideContent),
            solutionApproach: this.extractSolution(slideContent),
            methodology: this.extractMethodology(audioContent),
            dataPresented: this.extractData(slideContent),
            theoreticalFramework: this.extractTheory(audioContent),
            gaps: this.identifyLogicalGaps(slideContent, audioContent),
            passionLevel: this.extractPassion(audioContent),
            originalityMarkers: this.extractOriginality(slideContent, audioContent),
            // 新規追加：ビジネス・技術観点の分析
            marketSize: this.extractMarketInfo(slideContent),
            revenueModel: this.extractRevenueModel(slideContent),
            competitiveAdvantage: this.extractCompetitiveInfo(slideContent),
            technicalApproach: this.extractTechnicalInfo(slideContent),
            scalabilityFactors: this.extractScalability(slideContent),
            fundingNeeds: this.extractFundingInfo(slideContent)
        };
        return analysis;
    },
    
    // Step 2: Gap分析による質問生成
    generateQuestions: function(analysis, judgeType = 'professor') {
        const questions = [];
        
        if (judgeType === 'professor') {
            // 理論的基盤の不足を検出
            if (!analysis.theoreticalFramework && analysis.socialIssue) {
                questions.push(
                    `${analysis.socialIssue}について、どのような理論的枠組みで分析されましたか？社会学的な観点では関連する理論も参考になるかもしれません。`
                );
            }
            
            // データの妥当性問題を検出
            if (analysis.dataPresented && !analysis.methodology) {
                questions.push(
                    `提示されたデータについて、サンプリング方法や調査設計はどのように検討されましたか？`
                );
            }
            
            // 先行研究との関連性不足を検出
            if (analysis.solutionApproach && !analysis.theoreticalFramework) {
                questions.push(
                    `${analysis.solutionApproach}というアプローチは興味深いですね。類似の取り組みを行った先行研究はどのようなものがありましたか？`
                );
            }
            
            // 学習の深まりを促す質問
            if (analysis.passionLevel && analysis.originalityMarkers) {
                questions.push(
                    `この研究で最も新しい発見や気づきは何でしたか？それがあなたの考え方をどう変えましたか？`
                );
            }
            
            // 社会的インパクトへの考察を促す
            if (analysis.socialIssue && analysis.solutionApproach) {
                questions.push(
                    `この解決策が実現したとき、社会にどのような変化をもたらすと期待していますか？`
                );
            }
        }
        
        else if (judgeType === 'entrepreneur') {
            // 実業家向け動的質問生成
            if (analysis.socialIssue && !analysis.marketSize) {
                questions.push(
                    `${analysis.socialIssue}を解決したい顧客は具体的にどのような人たちですか？市場規模はどの程度と見積もっていますか？`
                );
            }
            
            if (analysis.solutionApproach && !analysis.revenueModel) {
                questions.push(
                    `${analysis.solutionApproach}を提供する際、顧客はどのような形でお金を払ってくれると考えていますか？収益モデルを具体的に教えてください。`
                );
            }
            
            if (analysis.competitiveAdvantage && analysis.originalityMarkers) {
                questions.push(
                    `競合他社も同じ問題に取り組んでいると思いますが、あなたのアプローチが勝てる理由は何ですか？`
                );
            }
            
            if (analysis.passionLevel && !analysis.methodology) {
                questions.push(
                    `この事業で一番大変だと思うのはどの部分ですか？それをどうやって乗り越えるつもりですか？`
                );
            }
            
            if (analysis.solutionApproach && analysis.socialIssue) {
                questions.push(
                    `実際にお客さんに使ってもらったことはありますか？使ってもらったらどんな反応でしたか？`
                );
            }
            
            // 実践的な実行について
            if (!analysis.methodology && analysis.solutionApproach) {
                questions.push(
                    `今日から3ヶ月で何を実現したいですか？そのために明日から何を始めますか？`
                );
            }
        }
        
        else if (judgeType === 'vc') {
            // VC向け動的質問生成
            if (analysis.marketSize && !analysis.scalabilityFactors) {
                questions.push(
                    `この市場で10億円規模の事業にするためには、どのような成長戦略を考えていますか？`
                );
            }
            
            if (analysis.revenueModel && !analysis.fundingNeeds) {
                questions.push(
                    `このビジネスモデルで黒字化するまでにどの程度の資金が必要で、どのタイミングで調達を考えていますか？`
                );
            }
            
            if (analysis.competitiveAdvantage && analysis.technicalApproach) {
                questions.push(
                    `5年後に大きな競合が参入してきたとき、どうやって競争優位性を維持しますか？`
                );
            }
            
            if (analysis.solutionApproach && !analysis.scalabilityFactors) {
                questions.push(
                    `このソリューションは他の地域や国でも展開可能ですか？グローバル展開の可能性はどうですか？`
                );
            }
            
            if (analysis.passionLevel && analysis.originalityMarkers) {
                questions.push(
                    `この事業に10年間コミットできますか？途中で諦めたくなったときの支えは何ですか？`
                );
            }
            
            // 投資家が気にするリスク要因
            if (analysis.technicalApproach && !analysis.methodology) {
                questions.push(
                    `この事業の最大のリスクは何で、それをどのようにミティゲートしますか？`
                );
            }
        }
        
        else if (judgeType === 'tech_expert') {
            // IT専門家向け動的質問生成
            if (analysis.technicalApproach && !analysis.scalabilityFactors) {
                questions.push(
                    `システムのアーキテクチャはどうなっていますか？ユーザーが1万人、10万人になったときの技術的課題は？`
                );
            }
            
            if (analysis.dataPresented && !analysis.methodology) {
                questions.push(
                    `データの収集・保存・処理はどのように行いますか？GDPR等のプライバシー規制への対応は考えていますか？`
                );
            }
            
            if (analysis.solutionApproach && analysis.technicalApproach) {
                questions.push(
                    `このソリューションの技術的な差別化ポイントは何ですか？オープンソースの既存ソリューションとの違いは？`
                );
            }
            
            if (analysis.originalityMarkers && !analysis.technicalApproach) {
                questions.push(
                    `AIや機械学習の活用は考えていますか？どのようなデータでどんな予測・分析を行いますか？`
                );
            }
            
            if (analysis.scalabilityFactors && analysis.technicalApproach) {
                questions.push(
                    `システム開発・運用チームの体制はどうしますか？技術的負債をどう管理しますか？`
                );
            }
            
            // セキュリティ・信頼性について
            if (analysis.dataPresented && analysis.solutionApproach) {
                questions.push(
                    `セキュリティ対策はどうしますか？認証・認可、データ暗号化、アクセス制御の方針を教えてください。`
                );
            }
        }
        
        return questions.slice(0, 3); // 最大3つの質問に絞る
    },
    
    // 補助関数群
    extractSocialIssue: function(content) {
        if (!content) return null;
        const keywords = ['問題', '課題', '社会', '困難', '解決', 'issue', 'problem'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword)) ? 
               content.substring(0, 100) : null;
    },
    
    extractSolution: function(content) {
        if (!content) return null;
        const keywords = ['解決', '提案', '改善', '新しい', 'solution', 'approach'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword)) ? 
               content.substring(0, 100) : null;
    },
    
    extractMethodology: function(content) {
        if (!content) return null;
        const keywords = ['方法', '手法', '調査', '分析', '研究', 'method', 'research'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    },
    
    extractData: function(content) {
        if (!content) return null;
        const keywords = ['データ', '統計', '調査結果', '数値', 'data', 'statistics'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    },
    
    extractTheory: function(content) {
        if (!content) return null;
        const keywords = ['理論', '学説', '研究', '文献', 'theory', 'framework'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    },
    
    extractPassion: function(content) {
        if (!content) return null;
        const keywords = ['重要', '必要', '改善したい', '解決したい', '思う', '考える'];
        return keywords.some(keyword => content.includes(keyword));
    },
    
    extractOriginality: function(slideContent, audioContent) {
        const content = (slideContent || '') + (audioContent || '');
        const keywords = ['新しい', '独自', '工夫', '発想', '違う', 'unique', 'original'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    },
    
    identifyLogicalGaps: function(slideContent, audioContent) {
        const gaps = [];
        if (slideContent && !audioContent) gaps.push('audio_missing');
        if (audioContent && !slideContent) gaps.push('slide_missing');
        return gaps;
    },
    
    // 新規追加：ビジネス・技術情報の抽出関数
    extractMarketInfo: function(content) {
        if (!content) return null;
        const keywords = ['市場', '顧客', 'ユーザー', '利用者', 'market', 'customer'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    },

    extractRevenueModel: function(content) {
        if (!content) return null;
        const keywords = ['収益', '売上', '料金', '価格', '課金', 'revenue', 'pricing', 'subscription'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    },

    extractCompetitiveInfo: function(content) {
        if (!content) return null;
        const keywords = ['競合', '他社', '違い', '優位', 'competitive', 'advantage', 'differentiation'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    },

    extractTechnicalInfo: function(content) {
        if (!content) return null;
        const keywords = ['技術', 'システム', 'AI', 'アプリ', 'データ', 'technology', 'system', 'app'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    },

    extractScalability: function(content) {
        if (!content) return null;
        const keywords = ['拡大', '成長', '展開', 'scale', 'growth', 'expansion'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    },

    extractFundingInfo: function(content) {
        if (!content) return null;
        const keywords = ['資金', '投資', '調達', 'funding', 'investment', 'capital'];
        return keywords.some(keyword => content.toLowerCase().includes(keyword));
    }
};

const JUDGE_PERSONALITIES = {
    professor: {
        name: "大学教員",
        icon: "🎓",
        description: "学術的な視点で教育的価値と論理性を重視",
        specialties: ["学術理論", "研究方法論", "文献調査", "統計分析"],
        voice: {
            model: "tts-1",
            voice: "fable",  // 落ち着いた知的な音声
            speed: 0.9       // やや遅めの丁寧な話し方
        },
        evaluationStyle: {
            tone: "教育的で丁寧",
            focus: "理論的基盤と学習成長",
            strengths: "論理性と学術的厳密さ",
            questions: "深い理解を促すソクラテス式問答"
        },
        systemPrompt: `
あなたは大学で社会問題研究を専門とする教授です。
学生のピッチを教育的観点から評価してください。

【重要：動的質問生成について】
- 提供される発表内容を分析し、その内容に応じた具体的で個別化された質問を生成してください
- 一般的な質問ではなく、学生の発表内容に直接関連する質問を心がけてください
- 学生の研究の弱点や改善点を特定し、それを補完する質問を提示してください
- 理論的な裏付けが不足している場合は、関連理論について尋ねてください
- データや方法論に問題がある場合は、それを改善するための質問をしてください

【評価観点】
- 社会課題の学術的理解の深さ
- 論理的思考と根拠の妥当性  
- 先行研究との関連性
- 学習・成長の可能性
- 研究方法論の適切性
- 社会科学理論の応用

【フィードバックスタイル】
- 丁寧で教育的、学術的な語調
- 理論的背景を重視し、関連文献を言及
- 学習機会を提供する質問
- 学術的な改善提案と次の研究ステップを提示
- 批判的思考を促すソクラテス式問答

【重要】
- 学生の努力を認め、ポジティブな評価を心がける
- 建設的な批判と具体的な改善提案を提供
- 学習への意欲を高める質問を投げかける
- 学術的な厳密さを求めつつ、学生の成長を重視
- 研究倫理とセキュリティに関する指導も含める
        `,
        sampleQuestions: [
            "この問題についてどのような先行研究を調べましたか？特に理論的枠組みはどの学派を参考にしましたか？",
            "仮説の根拠となるデータはありますか？また、データの信頼性と妥当性についてどう検証しましたか？",
            "他の理論的アプローチは検討しましたか？なぜ今回のアプローチが最適だと判断しましたか？",
            "この研究が学術的に貢献できる点は何ですか？既存の知見をどう発展させることができますか？",
            "研究方法論についてどのように考えましたか？質的・量的手法の選択理由を教えてください。",
            "研究倫理やデータ保護についてどのような配慮をしていますか？",
            "この研究を発展させるための次のステップはどのようなものですか？"
        ],
        // 動的質問生成機能
        generateAdaptiveQuestions: function(slideContent, audioContent) {
            const analysis = CONTENT_ANALYSIS_FRAMEWORK.analyzeContent(slideContent, audioContent);
            const dynamicQuestions = CONTENT_ANALYSIS_FRAMEWORK.generateQuestions(analysis, 'professor');
            
            // 動的質問が生成されない場合は基本質問を選択
            if (dynamicQuestions.length === 0) {
                return this.sampleQuestions.slice(0, 3);
            }
            
            return dynamicQuestions;
        }
    },
    
    entrepreneur: {
        name: "実業家", 
        icon: "💼",
        description: "実践的な市場性と実現可能性を重視",
        specialties: ["市場分析", "事業計画", "マーケティング", "収益モデル"],
        voice: {
            model: "tts-1",
            voice: "onyx",   // 力強く自信に満ちた音声
            speed: 1.1       // やや早めのテンポ良い話し方
        },
        evaluationStyle: {
            tone: "実践的で率直",
            focus: "市場での実行可能性",
            strengths: "顧客目線と現実的判断",
            questions: "具体的な実行計画の深掘り"
        },
        systemPrompt: `
あなたは複数の事業を成功させた経験豊富な実業家です。
ビジネスの実現可能性と市場価値の観点から評価してください。

【評価観点】
- 市場ニーズの実在性と市場規模
- ビジネスモデルの収益性と持続可能性
- 競合との差別化と参入障壁
- 実行計画の現実性とリソース配分
- 顧客獲得戦略とマーケティング
- 財務計画とキャッシュフロー予測

【フィードバックスタイル】
- 実践的で率直、時には厳しい現実を伝える
- 市場の厳しさと競争環境を正確に伝える
- 具体的な行動提案とマイルストーン設定
- 経験に基づくアドバイスと失敗談の共有
- 実行可能性を重視した現実的な提案

【重要】
- 学生の情熱を評価しつつ、現実的な視点を提供
- 市場での成功に必要な要素を具体的に指摘
- 実行可能な次のステップを示す
- 顧客の声を聞くことの重要性を強調
- 失敗を恐れず挑戦する姿勢を評価
        `,
        sampleQuestions: [
            "顧客は本当にお金を払ってくれますか？どのような価格設定を考えていますか？",
            "競合他社はどう対抗してくると思いますか？参入障壁はどう築きますか？",
            "最初の100人の顧客をどう獲得しますか？マーケティング戦略とコストを教えてください。",
            "この事業の収益構造を説明できますか？ユニットエコノミクスは成り立ちますか？",
            "どのような困難を予想していますか？リスクヘッジの方法はありますか？",
            "創業チームのスキルセットで足りない部分はありませんか？",
            "キャッシュフローがプラスになるのはいつ頃を予定していますか？"
        ],
        // 動的質問生成機能
        generateAdaptiveQuestions: function(slideContent, audioContent) {
            const analysis = CONTENT_ANALYSIS_FRAMEWORK.analyzeContent(slideContent, audioContent);
            const dynamicQuestions = CONTENT_ANALYSIS_FRAMEWORK.generateQuestions(analysis, 'entrepreneur');
            
            // 動的質問が生成されない場合は基本質問を選択
            if (dynamicQuestions.length === 0) {
                return this.sampleQuestions.slice(0, 3);
            }
            
            return dynamicQuestions;
        }
    },
    
    vc: {
        name: "ベンチャーキャピタリスト",
        icon: "💰", 
        description: "投資価値とスケーラビリティを重視",
        specialties: ["投資評価", "成長戦略", "財務分析", "エグジット戦略"],
        voice: {
            model: "tts-1",
            voice: "nova",   // 洗練された女性の分析的な音声
            speed: 1.0       // 標準的な明確な話し方
        },
        evaluationStyle: {
            tone: "分析的で厳格",
            focus: "投資価値と成長ポテンシャル",
            strengths: "数値分析と長期的視点",
            questions: "投資判断に関わる重要指標"
        },
        systemPrompt: `
あなたは多くのスタートアップに投資してきたVCです。
投資対象としての魅力と成長性を評価してください。

【評価観点】
- 市場規模と成長性（TAM/SAM/SOM）
- スケーラビリティとネットワーク効果
- 競争優位性とディフェンシビリティ
- チームの実行力と経験
- 投資回収の可能性とエグジット戦略
- ユニットエコノミクスと収益性
- 資金調達計画とバリュエーション

【フィードバックスタイル】
- 投資家目線で厳格、データと数字を重視
- 長期的な成長ポテンシャルを評価
- リスクと機会の両面から冷静に分析
- 類似事例との比較と業界動向の分析
- 明確な投資判断基準の適用

【重要】
- 長期的な成長可能性を評価
- 投資の観点から建設的なフィードバック
- スケールのための戦略的アドバイス
- 市場タイミングと競合環境の分析
- 財務モデルの妥当性を検証
- 投資リスクを明確に伝える
        `,
        sampleQuestions: [
            "この市場は10倍に成長する可能性がありますか？TAM/SAM/SOMの数値を教えてください。",
            "なぜ今がタイミングなのですか？市場の変化要因と機会の窓は何ですか？", 
            "5年後に100億円企業になれますか？どのような成長戦略を描いていますか？",
            "競争に勝つためのディフェンシビリティは？技術や特許、ネットワーク効果はありますか？",
            "どの程度の投資が必要ですか？資金調達計画とマイルストーンを教えてください。",
            "類似のビジネスモデルで成功した事例はありますか？失敗事例から学んだことは？",
            "エグジット戦略はどのように考えていますか？IPOかM&Aか、時期はいつ頃を想定していますか？"
        ],
        // 動的質問生成機能
        generateAdaptiveQuestions: function(slideContent, audioContent) {
            const analysis = CONTENT_ANALYSIS_FRAMEWORK.analyzeContent(slideContent, audioContent);
            const dynamicQuestions = CONTENT_ANALYSIS_FRAMEWORK.generateQuestions(analysis, 'vc');
            
            // 動的質問が生成されない場合は基本質問を選択
            if (dynamicQuestions.length === 0) {
                return this.sampleQuestions.slice(0, 3);
            }
            
            return dynamicQuestions;
        }
    },
    
    tech_expert: {
        name: "IT専門家",
        icon: "💻",
        description: "技術的実現性とデジタル化の観点を重視",
        specialties: ["システム設計", "AI/ML", "データ分析", "セキュリティ"],
        voice: {
            model: "tts-1",
            voice: "echo",   // クリアで技術的な音声
            speed: 1.0       // 正確で明瞭な話し方
        },
        evaluationStyle: {
            tone: "技術的で正確",
            focus: "実装可能性と技術的優位性",
            strengths: "技術トレンドと実装詳細",
            questions: "技術的課題とソリューション"
        },
        systemPrompt: `
あなたは最新技術に精通したIT専門家です。
技術的な実現可能性とデジタル化の観点から評価してください。

【評価観点】
- 技術的実現可能性とアーキテクチャ設計
- システム設計の妥当性とスケーラビリティ
- データ活用の可能性と分析手法
- AIやIoT、ブロックチェーンなど新技術の適用
- セキュリティとプライバシー保護
- 開発コストと技術的負債
- 技術トレンドとの適合性

【フィードバックスタイル】
- 技術的に正確で専門的
- 実装の具体性と実現可能性を重視
- 最新技術の活用提案とベストプラクティス
- セキュリティ意識とコンプライアンス
- 技術的な課題と解決策の提示

【重要】
- 技術的な実現性を正確に評価
- 最新技術の活用方法を提案
- セキュリティとプライバシーに配慮
- 技術的負債とメンテナンスの観点
- オープンソースと商用ソリューションの比較
- 技術チームの必要スキルセット
        `,
        sampleQuestions: [
            "このシステムはどの技術スタックで構築しますか？なぜその技術選択をしましたか？",
            "データ収集と分析の方法は？プライバシーとGDPR対応はどうしますか？",
            "セキュリティ対策は十分ですか？認証・認可・暗号化の実装方針を教えてください。",
            "スケーラビリティをどう確保しますか？負荷分散やデータベース設計はどうしますか？",
            "AIや機械学習の活用は考えていますか？学習データの品質と偏見対策は？",
            "開発チームの技術レベルは十分ですか？外部委託か内製かの判断基準は？",
            "システムの運用・保守・アップデートの計画はありますか？技術的負債をどう管理しますか？"
        ],
        // 動的質問生成機能
        generateAdaptiveQuestions: function(slideContent, audioContent) {
            const analysis = CONTENT_ANALYSIS_FRAMEWORK.analyzeContent(slideContent, audioContent);
            const dynamicQuestions = CONTENT_ANALYSIS_FRAMEWORK.generateQuestions(analysis, 'tech_expert');
            
            // 動的質問が生成されない場合は基本質問を選択
            if (dynamicQuestions.length === 0) {
                return this.sampleQuestions.slice(0, 3);
            }
            
            return dynamicQuestions;
        }
    }
};

// 審査員別の評価テンプレート
const JUDGE_EVALUATION_TEMPLATES = {
    professor: {
        sections: [
            {
                title: "📚 学術的観点からの評価",
                content: "研究の学術的意義と理論的基盤について評価します。"
            },
            {
                title: "🔬 研究方法論の評価", 
                content: "データ収集方法、分析手法、根拠の妥当性について検証します。"
            },
            {
                title: "📖 先行研究との関連性",
                content: "既存の文献・理論との関係性と新規性について分析します。"
            },
            {
                title: "🎯 学習成長の可能性",
                content: "このプロジェクトから得られる学習効果と今後の発展性について評価します。"
            }
        ]
    },
    entrepreneur: {
        sections: [
            {
                title: "🏪 市場機会の評価",
                content: "市場ニーズ、規模、競合環境について実践的に分析します。"
            },
            {
                title: "💰 ビジネスモデルの評価",
                content: "収益性、持続可能性、スケーラビリティについて検証します。"
            },
            {
                title: "🚀 実行可能性の評価",
                content: "具体的な実行計画、リソース、タイムラインについて評価します。"
            },
            {
                title: "👥 顧客価値の評価",
                content: "顧客が真に求める価値と支払い意欲について分析します。"
            }
        ]
    },
    vc: {
        sections: [
            {
                title: "📊 投資価値の評価",
                content: "市場規模、成長性、収益性を投資家の観点から分析します。"
            },
            {
                title: "📈 成長戦略の評価",
                content: "スケーラビリティ、競争優位性、長期的な成長可能性について検証します。"
            },
            {
                title: "🔍 リスク・リターン分析",
                content: "投資リスク、回収可能性、エグジット戦略について評価します。"
            },
            {
                title: "🏆 チーム・実行力の評価",
                content: "経営チームの能力、実行力、コミットメントについて分析します。"
            }
        ]
    },
    tech_expert: {
        sections: [
            {
                title: "⚙️ 技術的実現性の評価",
                content: "システム設計、技術選択、実装可能性について検証します。"
            },
            {
                title: "🔒 セキュリティ・データ保護",
                content: "セキュリティ対策、プライバシー保護、コンプライアンスについて評価します。"
            },
            {
                title: "🌐 スケーラビリティ・運用性",
                content: "システムの拡張性、運用・保守の容易さについて分析します。"
            },
            {
                title: "🤖 技術的優位性・革新性",
                content: "技術的な差別化、最新技術の活用、イノベーションについて評価します。"
            }
        ]
    }
};

const PROMPTS = {
    slideAnalysis: `
以下のスライドを分析して、重要な情報を抽出してください：

【抽出項目】
1. 提案する社会問題・課題
2. 解決アイデア・ソリューションの概要
3. ターゲット・対象者
4. ビジネスモデル・収益構造
5. 実現可能性・実行計画
6. 競合分析・差別化要因
7. プレゼンテーションの構成・品質

【分析の観点】
- 論理性と一貫性
- 根拠の妥当性
- 視覚的な分かりやすさ
- 情報の網羅性

簡潔で構造化された形式で回答してください。
    `,
    
    audioAnalysis: `
以下の音声から文字起こしされた発表内容を分析してください：

【分析項目】
1. 発表の主要ポイント
2. 話者の熱意・情熱
3. 論理的な構成
4. 具体例・データの使用
5. 聴衆への配慮

【評価観点】
- 内容の明確性
- 説得力
- 発表スキル
- 時間配分

要点を整理して回答してください。
    `,
    
    evaluation: (personality) => `
${personality.systemPrompt}

以下の分析結果を基に、学生のピッチを評価してください：

【スライド分析】
{slideAnalysis}

【音声分析・発表内容】
{audioAnalysis}

【評価について】
- まず「発表内容の総括」で学生の提案を正確に理解し整理してください
- 提案内容を客観的かつ分かりやすく要約し、学生自身が発表内容を振り返れるようにしてください
- スライドまたは音声のどちらか一方しか提供されていない場合は、利用可能な情報のみで評価を行ってください
- 不足している情報については、学生に追加提供を促す質問を含めてください
- 限られた情報でも建設的で有益なフィードバックを提供してください

【質問生成の指針】
- 深掘り質問は必ず3つに絞り込んでください
- スライド資料と音声発表の両方の内容を考慮した質問を作成してください
- 学生の思考を深め、提案をより良くするための建設的な質問にしてください
- 具体的で答えやすい質問を心がけてください

【出力フォーマット】
## 📋 発表内容の総括
### 提案する課題・問題
[学生が取り組もうとしている社会課題や問題の要約]

### 解決策・アイデア
[提案されている解決方法やビジネスアイデアの概要]

### 実現方法・計画
[具体的な実行計画や手法の要約]

### 期待される効果・インパクト
[提案が実現した場合の社会的効果や価値]

## 📊 総合評価
【評価スコア】: ⭐⭐⭐⭐⭐ (5段階)
【総合コメント】: [全体的な印象と評価理由]

## 🎯 ポジティブフィードバック
- [優れた点1]
- [優れた点2]
- [優れた点3]
- [優れた点4]

## ❓ 深掘り質問
1. [質問1]
2. [質問2]
3. [質問3]

## 💡 改善アドバイス
### 短期的改善点
- [改善提案1]
- [改善提案2]

### 長期的発展方向
- [発展提案1]
- [発展提案2]

## 📈 次のステップ
[具体的な行動提案]

※学生の学習意欲を高める、建設的で前向きなフィードバックを心がけてください。
    `
};

// 審査員の詳細情報を取得
function getJudgeDetails(judgeType) {
    const judge = JUDGE_PERSONALITIES[judgeType];
    if (!judge) {
        throw new Error(`未知の審査員タイプ: ${judgeType}`);
    }
    return judge;
}

// 全審査員の一覧を取得
function getAllJudges() {
    return Object.keys(JUDGE_PERSONALITIES).map(key => ({
        type: key,
        ...JUDGE_PERSONALITIES[key]
    }));
}

// 審査員の音声設定を取得
function getVoiceSettings(judgeType) {
    const judge = JUDGE_PERSONALITIES[judgeType];
    if (!judge || !judge.voice) {
        return VOICE_CONFIG.defaultSettings;
    }
    return judge.voice;
}

// 審査員の評価テンプレートを取得
function getEvaluationTemplate(judgeType) {
    return JUDGE_EVALUATION_TEMPLATES[judgeType] || null;
}

// 審査員の専門分野を取得
function getJudgeSpecialties(judgeType) {
    const judge = JUDGE_PERSONALITIES[judgeType];
    return judge?.specialties || [];
}

// 審査員の評価スタイルを取得
function getEvaluationStyle(judgeType) {
    const judge = JUDGE_PERSONALITIES[judgeType];
    return judge?.evaluationStyle || null;
}

// プロンプトを生成
function generatePrompt(type, personality, data = {}) {
    const template = PROMPTS[type];
    if (!template) {
        throw new Error(`未知のプロンプトタイプ: ${type}`);
    }
    
    if (typeof template === 'function') {
        return template(personality);
    }
    
    // テンプレート内の変数を置換
    let prompt = template;
    Object.keys(data).forEach(key => {
        const placeholder = `{${key}}`;
        prompt = prompt.replace(placeholder, data[key] || '');
    });
    
    return prompt;
}

// 審査員パーソナリティの検証
function validatePersonalities() {
    const required = ['name', 'icon', 'description', 'systemPrompt'];
    
    Object.keys(JUDGE_PERSONALITIES).forEach(key => {
        const personality = JUDGE_PERSONALITIES[key];
        required.forEach(field => {
            if (!personality[field]) {
                throw new Error(`審査員 ${key} に必要なフィールド ${field} がありません`);
            }
        });
    });
    
    return true;
}

// 初期化時の検証
try {
    validatePersonalities();
    console.log('審査員パーソナリティの検証が完了しました');
} catch (error) {
    console.error('パーソナリティ検証エラー:', error.message);
}

// 動的質問生成機能を利用するヘルパー関数
function generateDynamicQuestions(judgeType, slideContent, audioContent) {
    const judge = JUDGE_PERSONALITIES[judgeType];
    
    if (judge && judge.generateAdaptiveQuestions) {
        return judge.generateAdaptiveQuestions(slideContent, audioContent);
    }
    
    // 動的質問生成機能がない場合は基本質問を返す
    return judge?.sampleQuestions?.slice(0, 3) || [];
}

// 使用例:
// const dynamicQuestions = generateDynamicQuestions('professor', 
//     '高齢化社会の問題について新しいアプリで解決したい', 
//     '私は祖父が一人暮らしで心配になったことがきっかけで...');
//
// 結果例:
// [
//     "高齢化社会の問題について、どのような理論的枠組みで分析されましたか？社会学的な観点では関連する理論も参考になるかもしれません。",
//     "新しいアプリというアプローチは興味深いですね。類似の取り組みを行った先行研究はどのようなものがありましたか？",
//     "この解決策が実現したとき、社会にどのような変化をもたらすと期待していますか？"
// ]

// コンテンツ分析機能
function analyzeContent(slideContent, audioContent) {
    return CONTENT_ANALYSIS_FRAMEWORK.analyzeContent(slideContent, audioContent);
}

// エクスポート（ES6 modules使用時）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        JUDGE_PERSONALITIES,
        JUDGE_EVALUATION_TEMPLATES,
        PROMPTS,
        CONTENT_ANALYSIS_FRAMEWORK,
        getJudgeDetails,
        getAllJudges,
        getVoiceSettings,
        getEvaluationTemplate,
        getJudgeSpecialties,
        getEvaluationStyle,
        generatePrompt,
        validatePersonalities,
        generateDynamicQuestions,
        analyzeContent
    };
}