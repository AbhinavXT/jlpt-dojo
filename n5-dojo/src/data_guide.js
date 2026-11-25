// Guide: structured lessons (written for this app). body = HTML; check = [question, answer, wrong1, wrong2, wrong3]
const GUIDE = [
{ id: "writing-system", lv: 5, t: "1 · The three scripts", body: `
<p>Japanese mixes three scripts in one sentence:</p>
<table class="vt"><tr><th>Script</th><th>Used for</th><th>Example</th></tr>
<tr><td><b>Hiragana</b> ひらがな</td><td>Grammar endings, particles, native words without common kanji</td><td class="jp">たべ<b>ます</b>、わたし<b>は</b></td></tr>
<tr><td><b>Katakana</b> カタカナ</td><td>Foreign loanwords, names, emphasis, sound effects</td><td class="jp">コーヒー、テレビ、インド</td></tr>
<tr><td><b>Kanji</b> 漢字</td><td>Meaning-carrying stems: nouns, verb and adjective roots</td><td class="jp"><b>食</b>べます、<b>日本</b></td></tr></table>
<p class="jp big-ex">わたしは<b>毎朝</b>コーヒーを<b>飲</b>みます。</p>
<p>"I drink coffee every morning." Kanji carry the meaning (毎朝 every morning, 飲 drink), hiragana carry the grammar (は, を, みます), and katakana is the loanword (コーヒー).</p>
<p>Small kana written above kanji are <b>furigana</b>, the reading: <ruby>漢字<rt>かんじ</rt></ruby>. In this app's reading drills, tap a kanji to show its furigana.</p>
<p><b>Order of study:</b> hiragana → katakana → kanji, learned through words. There are no spaces between words in normal Japanese. Beginner texts (and the N5 exam) add them.</p>`,
  check: [["Which script is mainly used for loanwords like 'computer'?", "Katakana", "Hiragana", "Kanji", "Furigana"], ["In 食べます, what does the hiragana べます do?", "Carries the grammar (verb ending)", "Shows the reading of 食", "Marks a loanword", "Nothing, it's decoration"]] },
{ id: "sounds", lv: 5, t: "2 · Sounds and kana rules", body: `
<p>Japanese has 5 vowels, <b>a i u e o</b> (as in f<b>a</b>ther, m<b>ee</b>t, f<b>oo</b>d, g<b>e</b>t, g<b>o</b>), and each kana is one beat (mora).</p>
<ul>
<li><b>Dakuten ゛</b> voices a sound: か ka → が ga, さ→ざ, た→だ, は→ば. <b>Handakuten ゜</b> gives p: は→ぱ.</li>
<li><b>Small ゃゅょ</b> combine: き + ゃ = きゃ kya (one beat). Compare びょういん (hospital) with びよういん (beauty salon).</li>
<li><b>Small っ</b> doubles the next consonant with a short pause: きって kitte (stamp) vs きて kite (come).</li>
<li><b>Long vowels:</b> おかあさん, おにいさん, くうき, せんせい (ei), こうこう (ou), おおきい. In katakana, ー: コーヒー.</li>
<li><b>ん</b> is a full beat of its own: ほん (hon) is 2 beats.</li>
<li><b>Particles:</b> は is read <b>wa</b>, へ is read <b>e</b>, を is read <b>o</b> when used as particles.</li>
<li><b>Devoiced u/i:</b> です and ます usually sound like "des" and "mas".</li></ul>`,
  check: [["How is the particle は pronounced?", "wa", "ha", "ho", "e"], ["きって vs きて: what does small っ do?", "Doubles the next consonant (a short pause)", "Makes the vowel long", "Adds a y sound", "Nothing"], ["How many beats is とうきょう (Tokyo)?", "4", "2", "3", "5"]] },
{ id: "handwriting", lv: 5, t: "3 · Handwriting: stroke order rules", body: `
<p>Correct stroke order makes characters balanced, faster to write, and recognisable in handwriting. Most kanji follow these rules:</p>
<ol>
<li><b>Top to bottom:</b> 三, 言.</li>
<li><b>Left to right:</b> 川, 休 (亻 first).</li>
<li><b>Horizontal before vertical</b> when they cross: 十, 土.</li>
<li><b>Left-falling before right-falling:</b> 人, 八, 文.</li>
<li><b>Centre before symmetrical sides:</b> 小, 水.</li>
<li><b>Outside before inside, close the box last:</b> 日, 国 (frame → inside → bottom line).</li>
<li><b>Vertical through the middle last:</b> 中, 車 (the long vertical cuts through at the end).</li>
<li><b>Dots and small strokes last:</b> 犬, 玉.</li>
</ol>
<p><b>Stroke endings matter:</b> とめ (stop firmly), はね (flick up at the end, as in 小's middle hook), はらい (sweep and fade, as in 人).</p>
<p><b>Direction:</b> horizontal strokes go left→right, vertical strokes go top→bottom. The kana look-alikes depend on this: シ/ン have a final stroke going <b>up</b>, ツ/ソ have a stroke going <b>down</b>.</p>
<p><b>How to practise in this app:</b> every kana and kanji you learn gets a <b>writing card</b>. The first time you trace it over a faint guide; after that you write it from memory and each stroke is checked for shape, direction and order. Use the printed sheets in <code>jap/WRITING PRACTICE</code> for extra pen-and-paper practice.</p>`,
  check: [["In 日, which is written last?", "The bottom horizontal line closing the box", "The left vertical", "The middle line", "The top line"], ["In 十, which stroke comes first?", "The horizontal", "The vertical", "Either", "Both at once"], ["Which way does the last stroke of シ go?", "Up, from bottom-left", "Down, from top-right", "Left", "It's a dot"]] },
{ id: "sentence", lv: 5, t: "4 · Sentence structure", body: `
<p>Japanese is <b>Subject-Object-Verb</b>: the verb comes last, and small words called <b>particles</b> mark each phrase's role.</p>
<p class="jp big-ex">わたし<b>は</b> パン<b>を</b> 食べます。</p><p>I (topic) / bread (object) / eat. Because particles carry the roles, word order is flexible (except that the verb stays last): パンを わたしは 食べます means the same.</p>
<ul><li><b>Topic は</b> sets what you're talking about. It's often dropped when obvious: 食べます。 "(I) eat."</li>
<li>No articles (a/the), no plurals: 本 = book/books/the book.</li>
<li>Questions: add <b>か</b>, with no change in word order: 食べますか。</li>
<li>Modifiers come <b>before</b> what they modify: 大きい 本 (big book), 日本の 車 (Japanese car), きのう 買った 本 (the book I bought yesterday).</li></ul>`,
  check: [["Where does the verb go in a Japanese sentence?", "At the end", "At the start", "After the subject", "Anywhere"], ["How do you turn 食べます into a question?", "Add か: 食べますか", "Swap the word order", "Add は", "Use a question mark only"]] },
{ id: "particles", lv: 5, t: "5 · Particles cheat sheet", body: `
<table class="vt"><tr><th>Particle</th><th>Role</th><th>Example</th></tr>
<tr><td class="jp">は (wa)</td><td>topic: "as for…"</td><td class="jp">わたし<b>は</b> 学生です。</td></tr>
<tr><td class="jp">が</td><td>subject (new info, question words); with すき/わかる/ある/いる/ほしい</td><td class="jp">だれ<b>が</b> 来ましたか。/ ねこ<b>が</b> すきです。</td></tr>
<tr><td class="jp">を (o)</td><td>direct object</td><td class="jp">本<b>を</b> 読みます。</td></tr>
<tr><td class="jp">に</td><td>time point; destination; location of existence; recipient</td><td class="jp">七時<b>に</b> おきます。/ 東京<b>に</b> すんで います。</td></tr>
<tr><td class="jp">へ (e)</td><td>direction</td><td class="jp">日本<b>へ</b> 行きます。</td></tr>
<tr><td class="jp">で</td><td>place of action; means or tool</td><td class="jp">へや<b>で</b> 勉強します。/ バス<b>で</b> 行きます。</td></tr>
<tr><td class="jp">と</td><td>and (complete list); with</td><td class="jp">パン<b>と</b> たまご / 友だち<b>と</b></td></tr>
<tr><td class="jp">や</td><td>and (example list)</td><td class="jp">本<b>や</b> ノート</td></tr>
<tr><td class="jp">も</td><td>also (replaces は/が/を)</td><td class="jp">わたし<b>も</b></td></tr>
<tr><td class="jp">の</td><td>possession / description</td><td class="jp">先生<b>の</b> 本</td></tr>
<tr><td class="jp">から / まで</td><td>from / until</td><td class="jp">九時<b>から</b> 五時<b>まで</b></td></tr>
<tr><td class="jp">か / ね / よ</td><td>question / "right?" / "you know"</td><td class="jp">そうです<b>ね</b>。</td></tr></table>
<p><b>は vs が, the short version:</b> は marks what you're talking about, or contrasts it; が points out <i>which one</i> or introduces something new. Question words (だれ, なに, どれ) always take が, never は.</p>
<p><b>に vs で for places:</b> に is where something <i>is</i> (いる/ある/すむ); で is where something <i>happens</i>.</p>`,
  check: [["へや＿ ねます (I sleep in my room). Which particle?", "で", "に", "を", "が"], ["こうえん＿ 子どもが います. Which particle?", "に", "で", "を", "へ"], ["だれ＿ 来ましたか. Which particle?", "が", "は", "を", "も"]] },
{ id: "desu", lv: 5, t: "6 · Nouns and です", body: `
<table class="vt"><tr><th></th><th>Polite</th><th>Plain (casual)</th></tr>
<tr><td>is</td><td class="jp">学生です</td><td class="jp">学生だ</td></tr>
<tr><td>is not</td><td class="jp">学生じゃありません / 学生じゃないです</td><td class="jp">学生じゃない</td></tr>
<tr><td>was</td><td class="jp">学生でした</td><td class="jp">学生だった</td></tr>
<tr><td>was not</td><td class="jp">学生じゃありませんでした</td><td class="jp">学生じゃなかった</td></tr></table>
<p>では is the formal version of じゃ: 学生ではありません. In casual questions だ is dropped: 学生？</p>`,
  check: [["Polite past of 学生です?", "学生でした", "学生だった", "学生じゃない", "学生ますた"], ["Plain negative of 先生だ?", "先生じゃない", "先生じゃありません", "先生でした", "先生ない"]] },
{ id: "adjectives", lv: 5, t: "7 · Adjectives: い and な", body: `
<table class="vt"><tr><th></th><th>い-adj (たかい)</th><th>な-adj (しずか)</th></tr>
<tr><td>before a noun</td><td class="jp">たかい 本</td><td class="jp">しずか<b>な</b> へや</td></tr>
<tr><td>is (polite)</td><td class="jp">たかいです</td><td class="jp">しずかです</td></tr>
<tr><td>is not</td><td class="jp">たか<b>くない</b>(です)</td><td class="jp">しずか<b>じゃない</b>(です)</td></tr>
<tr><td>was</td><td class="jp">たか<b>かった</b>(です)</td><td class="jp">しずか<b>だった</b> / でした</td></tr>
<tr><td>was not</td><td class="jp">たか<b>くなかった</b>(です)</td><td class="jp">しずか<b>じゃなかった</b>(です)</td></tr>
<tr><td>and (て)</td><td class="jp">たか<b>くて</b></td><td class="jp">しずか<b>で</b></td></tr>
<tr><td>adverb</td><td class="jp">はや<b>く</b> 起きる</td><td class="jp">しずか<b>に</b> 話す</td></tr></table>
<p><b>Traps:</b> いい conjugates from よい: よくない, よかった. きれい, きらい and ゆうめい end in い but are <b>な</b>-adjectives (きれいな, きれいじゃない).</p>
<p>Practise in <b>Drills → Conjugation</b>.</p>`,
  check: [["Past tense of いい?", "よかった", "いかった", "いいでした", "よいだった"], ["Negative of きれい?", "きれいじゃない", "きれくない", "きれいくない", "きれかった"], ["'A quiet room'?", "しずかな へや", "しずかい へや", "しずかの へや", "しずか へや"]] },
{ id: "verbs", lv: 5, t: "8 · Verbs: groups and forms", body: `
<p>Every verb belongs to one of three groups. The group decides how it conjugates.</p>
<ul><li><b>る-verbs (ichidan)</b> end in <i>-iru</i> or <i>-eru</i>: たべる, みる, おきる. Drop る and add the ending: たべ<b>ます</b>, たべ<b>ない</b>, たべ<b>て</b>.</li>
<li><b>う-verbs (godan)</b>: everything else, plus some -iru/-eru verbs (かえる to return, はいる, はしる, しる, きる to cut). The last kana shifts row: のむ → のみます, のまない.</li>
<li><b>Irregular:</b> する (do) and くる (come).</li></ul>
<table class="vt"><tr><th>Form</th><th>たべる</th><th>のむ</th><th>かく</th><th>する</th><th>くる</th></tr>
<tr><td>ます</td><td class="jp">たべます</td><td class="jp">のみます</td><td class="jp">かきます</td><td class="jp">します</td><td class="jp">きます</td></tr>
<tr><td>ない</td><td class="jp">たべない</td><td class="jp">のまない</td><td class="jp">かかない</td><td class="jp">しない</td><td class="jp">こない</td></tr>
<tr><td>て</td><td class="jp">たべて</td><td class="jp">のんで</td><td class="jp">かいて</td><td class="jp">して</td><td class="jp">きて</td></tr>
<tr><td>た</td><td class="jp">たべた</td><td class="jp">のんだ</td><td class="jp">かいた</td><td class="jp">した</td><td class="jp">きた</td></tr></table>
<p><b>て-form song (う-verbs):</b> う・つ・る → って · む・ぶ・ぬ → んで · く → いて · ぐ → いで · す → して · and the exception <b>行く → 行って</b>. た-form = て-form with た/だ.</p>
<p><b>ない-form trap:</b> verbs ending in う use わ: かう → か<b>わ</b>ない. ある → ない.</p>
<p>The て-form is the workhorse of N5 and N4 grammar: ～てください, ～ています, ～てもいい, ～てから, and more. Drill it until it's automatic.</p>`,
  check: [["て-form of のむ?", "のんで", "のみて", "のって", "のむて"], ["ない-form of かう (buy)?", "かわない", "かあない", "かいない", "かうない"], ["Which is a う-verb even though it ends in -eru?", "かえる (to return)", "たべる", "ねる", "おしえる"]] },
{ id: "exist", lv: 5, t: "9 · Existence and location", body: `
<p><b>あります</b> for things and plants, <b>います</b> for people and animals.</p>
<p class="jp big-ex">つくえの 上に 本が あります。 / こうえんに 子どもが います。</p>
<p>Pattern: <b>[place] に [thing] が あります</b> ("there is X at place") or <b>[thing] は [place] に あります</b> ("X is at place").</p>
<table class="vt"><tr><td class="jp">上 うえ</td><td>on, above</td><td class="jp">下 した</td><td>under</td></tr>
<tr><td class="jp">中 なか</td><td>inside</td><td class="jp">外 そと</td><td>outside</td></tr>
<tr><td class="jp">前 まえ</td><td>in front</td><td class="jp">うしろ</td><td>behind</td></tr>
<tr><td class="jp">右 みぎ / 左 ひだり</td><td>right / left</td><td class="jp">となり / よこ</td><td>next to / beside</td></tr></table>
<p>Use them with の: いすの 下, 駅の 前.</p>`,
  check: [["ねこが ＿＿. (There's a cat.)", "います", "あります", "です", "します"], ["'Under the chair'?", "いすの 下", "下の いす", "いすに 下", "いす 下の"]] },
{ id: "kosoado", lv: 5, t: "10 · こ・そ・あ・ど and question words", body: `
<table class="vt"><tr><th></th><th>こ (near me)</th><th>そ (near you)</th><th>あ (over there)</th><th>ど (which?)</th></tr>
<tr><td>thing</td><td class="jp">これ</td><td class="jp">それ</td><td class="jp">あれ</td><td class="jp">どれ</td></tr>
<tr><td>+ noun</td><td class="jp">この</td><td class="jp">その</td><td class="jp">あの</td><td class="jp">どの</td></tr>
<tr><td>place</td><td class="jp">ここ</td><td class="jp">そこ</td><td class="jp">あそこ</td><td class="jp">どこ</td></tr>
<tr><td>direction (polite)</td><td class="jp">こちら</td><td class="jp">そちら</td><td class="jp">あちら</td><td class="jp">どちら</td></tr></table>
<p><b>Question words:</b> なに/なん (what), だれ (who), いつ (when), どこ (where), どう (how), どうして/なぜ (why), いくら (how much), いくつ (how many, how old), どれ/どの/どちら (which).</p>
<p>Question word + か = some-: だれか (someone), なにか (something). Question word + も + negative = no-: だれも いません (nobody is here).</p>`,
  check: [["＿＿ 本は わたしのです. (This book is mine.)", "この", "これ", "ここ", "こちら"], ["だれも ＿＿.", "いません", "います", "あります", "です"]] },
{ id: "numbers", lv: 5, t: "11 · Numbers, time and counters", body: `
<p>1–10: いち に さん よん(し) ご ろく なな(しち) はち きゅう(く) じゅう. 100 ひゃく, 1,000 せん, 10,000 <b>まん</b>. Japanese groups digits in fours: 100,000 = じゅうまん.</p>
<p><b>Sound changes:</b> 300 さん<b>びゃく</b>, 600 ろっ<b>ぴゃく</b>, 800 はっ<b>ぴゃく</b>, 3,000 さん<b>ぜん</b>, 8,000 はっ<b>せん</b>.</p>
<p><b>Time:</b> 4時 <b>よ</b>じ, 7時 <b>しち</b>じ, 9時 <b>く</b>じ. Minutes: 1 いっぷん, 3 さんぷん, 4 よんぷん, 6 ろっぷん, 8 はっぷん, 10 じゅっぷん; 2, 5, 7, 9 take ふん. Half past = はん.</p>
<p><b>Dates:</b> 1st ついたち, 2 ふつか, 3 みっか, 4 よっか, 5 いつか, 6 むいか, 7 なのか, 8 ようか, 9 ここのか, 10 とおか, 14 じゅうよっか, 20 はつか, 24 にじゅうよっか; the rest are number + にち. Months: 4月 <b>し</b>がつ, 7月 <b>しち</b>がつ, 9月 <b>く</b>がつ.</p>
<table class="vt"><tr><th>Counter</th><th>For</th><th>1 / 3 / 6 / 8 / 10</th></tr>
<tr><td class="jp">～つ</td><td>things (1–10)</td><td class="jp">ひとつ / みっつ / むっつ / やっつ / とお</td></tr>
<tr><td class="jp">～人</td><td>people</td><td class="jp">ひとり / さんにん / ろくにん / はちにん / じゅうにん (2 = ふたり)</td></tr>
<tr><td class="jp">～本</td><td>long things</td><td class="jp">いっぽん / さんぼん / ろっぽん / はっぽん / じゅっぽん</td></tr>
<tr><td class="jp">～枚</td><td>flat things</td><td class="jp">いちまい / さんまい / ろくまい / はちまい / じゅうまい</td></tr>
<tr><td class="jp">～冊</td><td>books</td><td class="jp">いっさつ / さんさつ / ろくさつ / はっさつ / じゅっさつ</td></tr>
<tr><td class="jp">～回 / ～個</td><td>times / small things</td><td class="jp">いっかい / さんかい / ろっかい / はっかい / じゅっかい</td></tr></table>
<p>Listening for numbers is the most common N5 listening question. Use <b>Drills → Numbers → Listen</b>.</p>`,
  check: [["8:00?", "はちじ", "はっじ", "やじ", "はちじかん"], ["Three pens (本)?", "さんぼん", "さんほん", "さんぽん", "みっぽん"], ["The 20th of the month?", "はつか", "にじゅうにち", "にじゅっか", "ふつか"]] },
{ id: "politeness", lv: 5, t: "12 · Polite vs casual speech", body: `
<p>N5 teaches the <b>polite</b> style (です/ます), which is safe with anyone. Friends and family use the <b>plain</b> style.</p>
<table class="vt"><tr><th>Polite</th><th>Plain</th></tr>
<tr><td class="jp">行きます / 行きません</td><td class="jp">行く / 行かない</td></tr>
<tr><td class="jp">行きました / 行きませんでした</td><td class="jp">行った / 行かなかった</td></tr>
<tr><td class="jp">たかいです</td><td class="jp">たかい</td></tr>
<tr><td class="jp">学生です</td><td class="jp">学生だ</td></tr></table>
<p>The plain form also appears <b>inside</b> polite sentences, before nouns and many patterns: 行く ことが できます, 食べた ことが あります, きのう 買った 本. Learn both styles from the start; N4 grammar is built on the plain form.</p>`,
  check: [["Plain form of 行きませんでした?", "行かなかった", "行かない", "行った", "行きなかった"]] },
{ id: "study-n5", lv: 5, t: "13 · How to study N5 effectively", body: `
<ul><li><b>Reviews every day, even 5 minutes.</b> Missed days cost more than they seem: reviews pile up and memories fade.</li>
<li><b>Write by hand.</b> Writing cards plus paper sheets. Writing builds recognition too.</li>
<li><b>Say everything out loud.</b> Use the ▶ buttons and shadow the audio.</li>
<li><b>Read real sentences early.</b> Drills → Sentences gives you thousands of real example sentences that use only the kanji you know, with furigana on tap.</li>
<li><b>Don't over-perfect kana.</b> 90% recognition is enough to start words; speed comes from reading.</li>
<li><b>Mock tests are for learning.</b> Every wrong answer goes back into your reviews.</li></ul>` },
{ id: "plain-uses", lv: 4, t: "N4 · 1 · The plain form everywhere", body: `
<p>At N4 the plain form becomes the backbone. Learn to recognise it inside sentences:</p>
<ul><li><b>Noun-modifying clauses:</b> [plain clause] + noun: 日本で 買った カメラ (the camera I bought in Japan), 話している 人.</li>
<li><b>Quoting and thinking:</b> plain + と思います / と言いました: 明日は 雨が 降ると 思います. With nouns and な-adj, add だ: 先生だと 思います.</li>
<li><b>Explaining:</b> plain + んです (のです) gives an explanation or seeks one: どうしたんですか。 頭が 痛いんです。</li>
<li><b>Before many patterns:</b> ～つもり, ～予定, ～はず, ～かもしれない, ～でしょう, ～ので, ～のに, ～そうだ (hearsay).</li></ul>`,
  check: [["'I think it will rain' = 雨が ＿＿ と思います", "降る", "降ります", "降って", "降り"], ["どうしたんですか means…", "What's the matter?", "Where did you go?", "What will you do?", "Why did you do it?"]] },
{ id: "conditionals", lv: 4, t: "N4 · 2 · Four ways to say 'if'", body: `
<table class="vt"><tr><th>Form</th><th>Use</th><th>Example</th></tr>
<tr><td class="jp">～たら</td><td>if / when (most general; also 'after')</td><td class="jp">駅に 着いたら、電話して ください。</td></tr>
<tr><td class="jp">～ば</td><td>if (condition → result), often general truths and advice</td><td class="jp">安ければ 買います。/ 練習すれば 上手に なる。</td></tr>
<tr><td class="jp">～と</td><td>whenever / automatically follows (no requests or wishes after it)</td><td class="jp">春に なると 花が 咲きます。</td></tr>
<tr><td class="jp">～なら</td><td>if that's the case (responding to a topic)</td><td class="jp">京都に 行くなら、お寺を 見て ください。</td></tr></table>
<p>When in doubt, <b>たら</b> is usually acceptable. Forms: 行く → 行ったら / 行けば / 行くと / 行くなら; たかい → たかかったら / たかければ.</p>`,
  check: [["Which conditional can't be followed by a request?", "～と", "～たら", "～ば", "～なら"], ["ば-form of 行く?", "行けば", "行くば", "行かば", "行ったば"]] },
{ id: "giving", lv: 4, t: "N4 · 3 · Giving and receiving", body: `
<table class="vt"><tr><th>Verb</th><th>Direction</th><th>Example</th></tr>
<tr><td class="jp">あげる</td><td>I / insider → others</td><td class="jp">わたしは 友だちに 本を あげました。</td></tr>
<tr><td class="jp">くれる</td><td>others → me / my side</td><td class="jp">友だちが わたしに 本を くれました。</td></tr>
<tr><td class="jp">もらう</td><td>receive from (に / から)</td><td class="jp">わたしは 友だちに 本を もらいました。</td></tr></table>
<p>With the て-form they describe favours: 読んで あげる (read for someone), 手伝って くれる (someone helps me), 直して もらう (have someone fix it). Polite versions: さしあげる, くださる, いただく.</p>`,
  check: [["友だちが わたしに プレゼントを ＿＿.", "くれました", "あげました", "もらいました", "さしあげました"]] },
{ id: "voice", lv: 4, t: "N4 · 4 · Potential, passive and causative", body: `
<table class="vt"><tr><th></th><th>う-verb 書く</th><th>る-verb 食べる</th><th>する</th><th>くる</th></tr>
<tr><td>potential (can)</td><td class="jp">書ける</td><td class="jp">食べられる</td><td class="jp">できる</td><td class="jp">こられる</td></tr>
<tr><td>passive (be done)</td><td class="jp">書かれる</td><td class="jp">食べられる</td><td class="jp">される</td><td class="jp">こられる</td></tr>
<tr><td>causative (make/let)</td><td class="jp">書かせる</td><td class="jp">食べさせる</td><td class="jp">させる</td><td class="jp">こさせる</td></tr>
<tr><td>causative-passive</td><td class="jp">書かされる / 書かせられる</td><td class="jp">食べさせられる</td><td class="jp">させられる</td><td class="jp">こさせられる</td></tr></table>
<p>Potential takes が for the object: 漢字<b>が</b> 読めます. The Japanese passive often signals that something happened <b>to</b> you, often unpleasant: 雨に 降られた (I got rained on).</p>`,
  check: [["Potential of 読む?", "読める", "読まれる", "読ませる", "読みられる"], ["母は 弟に 野菜を 食べ＿＿. (made him eat)", "させました", "られました", "ました", "させられました"]] },
{ id: "keigo", lv: 4, t: "N4 · 5 · Keigo basics", body: `
<p><b>尊敬語 (respectful)</b> raises the other person's actions. <b>謙譲語 (humble)</b> lowers your own.</p>
<table class="vt"><tr><th>Plain</th><th>Respectful</th><th>Humble</th></tr>
<tr><td class="jp">いる / 行く / 来る</td><td class="jp">いらっしゃる</td><td class="jp">おる / まいる</td></tr>
<tr><td class="jp">言う</td><td class="jp">おっしゃる</td><td class="jp">申す</td></tr>
<tr><td class="jp">食べる / 飲む</td><td class="jp">召し上がる</td><td class="jp">いただく</td></tr>
<tr><td class="jp">見る</td><td class="jp">ご覧になる</td><td class="jp">拝見する</td></tr>
<tr><td class="jp">する</td><td class="jp">なさる</td><td class="jp">いたす</td></tr>
<tr><td class="jp">知っている</td><td class="jp">ご存じだ</td><td class="jp">存じている</td></tr></table>
<p>General patterns: respectful <b>お + stem + になる</b> (お帰りになる); humble <b>お + stem + する</b> (お持ちする).</p>`,
  check: [["Respectful 'say'?", "おっしゃる", "申す", "いたす", "まいる"], ["Humble 'I'll carry it'?", "お持ちします", "お持ちになります", "持たれます", "持たせます"]] },
{ id: "transitive", lv: 4, t: "N4 · 6 · Transitive and intransitive pairs", body: `
<p>Many verbs come in pairs: <b>transitive</b> (someone does it, takes を) and <b>intransitive</b> (it happens, takes が).</p>
<table class="vt"><tr><th>Transitive (を)</th><th>Intransitive (が)</th><th>Meaning</th></tr>
<tr><td class="jp">開ける</td><td class="jp">開く</td><td>open</td></tr><tr><td class="jp">閉める</td><td class="jp">閉まる</td><td>close</td></tr>
<tr><td class="jp">つける</td><td class="jp">つく</td><td>turn on</td></tr><tr><td class="jp">消す</td><td class="jp">消える</td><td>turn off / go out</td></tr>
<tr><td class="jp">始める</td><td class="jp">始まる</td><td>begin</td></tr><tr><td class="jp">止める</td><td class="jp">止まる</td><td>stop</td></tr>
<tr><td class="jp">入れる</td><td class="jp">入る</td><td>put in / enter</td></tr><tr><td class="jp">出す</td><td class="jp">出る</td><td>take out / go out</td></tr>
<tr><td class="jp">こわす</td><td class="jp">こわれる</td><td>break</td></tr><tr><td class="jp">落とす</td><td class="jp">落ちる</td><td>drop / fall</td></tr></table>
<p>State descriptions: intransitive + ている (ドアが 開いて いる, the door is open) vs transitive + てある (ドアが 開けて ある, the door has been opened on purpose).</p>`,
  check: [["ドアが ＿＿ います. (The door is open.)", "開いて", "開けて", "開く", "開け"], ["Transitive partner of 始まる?", "始める", "始めさせる", "始まらせる", "始まれる"]] },
{ id: "seems", lv: 4, t: "N4 · 7 · そう, よう, らしい, みたい", body: `
<table class="vt"><tr><th>Form</th><th>Basis</th><th>Example</th></tr>
<tr><td class="jp">stem + そう</td><td>looks like (from appearance)</td><td class="jp">おいしそう、雨が 降りそう</td></tr>
<tr><td class="jp">plain + そうだ</td><td>I heard that (hearsay)</td><td class="jp">雨が 降るそうです。</td></tr>
<tr><td class="jp">plain + ようだ</td><td>it seems (your own judgement, formal)</td><td class="jp">だれも いないようです。</td></tr>
<tr><td class="jp">plain + みたい</td><td>seems (casual ようだ)</td><td class="jp">かぜ みたい。</td></tr>
<tr><td class="jp">plain + らしい</td><td>apparently (from what you've heard or read)</td><td class="jp">あの 店は 高いらしい。</td></tr></table>
<p>Note: いい → よさそう, ない → なさそう.</p>`,
  check: [["'Looks delicious' (from seeing it)?", "おいしそう", "おいしいそう", "おいしいらしい", "おいしいよう"], ["'I heard it will rain'?", "雨が 降るそうです", "雨が 降りそうです", "雨が 降るみたいです", "雨が 降るようです"]] }
];
