(() => {
  "use strict";

  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const whole = value => String(Math.round(value * 100) / 100).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  const fraction = (numerator, denominator) => {
    const divisor = gcd(numerator, denominator);
    const n = numerator / divisor;
    const d = denominator / divisor;
    return d === 1 ? String(n) : `${n}/${d}`;
  };
  const int = (random, min, max) => Math.floor(random() * (max - min + 1)) + min;
  const pick = (random, values) => values[int(random, 0, values.length - 1)];
  const scaleFor = difficulty => difficulty === "gentle" ? .7 : difficulty === "challenge" ? 1.35 : 1;
  const q = (prompt, answer, explanationJa, explanationEn, wordJa = "", wordEn = "") => ({
    prompt, answer: String(answer), explanationJa, explanationEn, wordJa, wordEn
  });

  const generators = {
    add10(random) {
      const a = int(random, 0, 9), b = int(random, 0, 10 - a);
      return q(`${a} + ${b} = ?`, a + b, `${a}と${b}を あわせると ${a + b}。`, `${a} plus ${b} equals ${a + b}.`);
    },
    sub10(random) {
      const a = int(random, 2, 10), b = int(random, 0, a);
      return q(`${a} − ${b} = ?`, a - b, `${a}から${b}を ひくと ${a - b}。`, `${a} minus ${b} equals ${a - b}.`);
    },
    add20(random, difficulty) {
      const factor = scaleFor(difficulty), a = int(random, 4, Math.round(12 * factor)), b = int(random, 2, Math.max(3, 20 - a));
      return q(`${a} + ${b} = ?`, a + b, `こたえは ${a + b}。`, `The answer is ${a + b}.`);
    },
    sub20(random, difficulty) {
      const a = int(random, 10, difficulty === "challenge" ? 30 : 20), b = int(random, 2, a);
      return q(`${a} − ${b} = ?`, a - b, `こたえは ${a - b}。`, `The answer is ${a - b}.`);
    },
    missing(random) {
      const answer = int(random, 1, 9), b = int(random, 1, 9), total = answer + b;
      return q(`□ + ${b} = ${total}`, answer, `${total}から${b}を ひくと ${answer}。`, `${total} minus ${b} gives the missing number ${answer}.`);
    },
    greater(random, difficulty) {
      const max = difficulty === "challenge" ? 100 : 30;
      let a = int(random, 1, max), b = int(random, 1, max);
      if (a === b) b += 1;
      return q(`${a}  or  ${b}`, Math.max(a, b), `大きい かずは ${Math.max(a, b)}。`, `${Math.max(a, b)} is the greater number.`, "大きい かずは どっち？", "Which number is greater?");
    },
    tens(random, difficulty) {
      const tens = int(random, 1, difficulty === "challenge" ? 9 : 5), ones = int(random, 0, 9);
      return q(`${tens * 10} + ${ones} = ?`, tens * 10 + ones, `${tens}この10と${ones}この1で ${tens * 10 + ones}。`, `${tens} tens and ${ones} ones make ${tens * 10 + ones}.`);
    },
    add100(random, difficulty) {
      const max = difficulty === "gentle" ? 50 : difficulty === "challenge" ? 200 : 100;
      const a = int(random, 12, max - 10), b = int(random, 5, max - a);
      return q(`${a} + ${b} = ?`, a + b, `こたえは ${a + b}。`, `The answer is ${a + b}.`);
    },
    sub100(random, difficulty) {
      const max = difficulty === "challenge" ? 200 : 100, a = int(random, 20, max), b = int(random, 5, a);
      return q(`${a} − ${b} = ?`, a - b, `こたえは ${a - b}。`, `The answer is ${a - b}.`);
    },
    timesEasy(random) {
      const a = pick(random, [2, 5, 10]), b = int(random, 1, 10);
      return q(`${a} × ${b} = ?`, a * b, `${a}を${b}かいで ${a * b}。`, `${a} times ${b} equals ${a * b}.`);
    },
    times34(random) {
      const a = pick(random, [3, 4]), b = int(random, 1, 10);
      return q(`${a} × ${b} = ?`, a * b, `こたえは ${a * b}。`, `The answer is ${a * b}.`);
    },
    times67(random) {
      const a = pick(random, [6, 7]), b = int(random, 1, 10);
      return q(`${a} × ${b} = ?`, a * b, `こたえは ${a * b}。`, `The answer is ${a * b}.`);
    },
    times89(random) {
      const a = pick(random, [8, 9]), b = int(random, 1, 10);
      return q(`${a} × ${b} = ?`, a * b, `こたえは ${a * b}。`, `The answer is ${a * b}.`);
    },
    money(random, difficulty) {
      const a = int(random, 1, difficulty === "challenge" ? 12 : 8) * 10, b = int(random, 1, 8) * 10;
      return q(`¥${a} + ¥${b} = ?`, a + b, `あわせて ¥${a + b}。`, `Together they cost ¥${a + b}.`, `¥${a}のおかしと ¥${b}のおかしを かいます。ぜんぶで いくら？`, `You buy a ¥${a} snack and a ¥${b} snack. How much altogether?`);
    },
    add1000(random, difficulty) {
      const max = difficulty === "gentle" ? 500 : difficulty === "challenge" ? 3000 : 1000;
      const a = int(random, 100, max - 50), b = int(random, 20, max - a);
      return q(`${a} + ${b} = ?`, a + b, `こたえは ${a + b}。`, `The answer is ${a + b}.`);
    },
    sub1000(random, difficulty) {
      const max = difficulty === "challenge" ? 3000 : 1000, a = int(random, 200, max), b = int(random, 20, a);
      return q(`${a} − ${b} = ?`, a - b, `こたえは ${a - b}。`, `The answer is ${a - b}.`);
    },
    multiply2x1(random, difficulty) {
      const a = int(random, 11, difficulty === "challenge" ? 199 : 99), b = int(random, 2, 9);
      return q(`${a} × ${b} = ?`, a * b, `こたえは ${a * b}。`, `The answer is ${a * b}.`);
    },
    divideExact(random, difficulty) {
      const divisor = int(random, 2, difficulty === "challenge" ? 12 : 9), answer = int(random, 2, difficulty === "gentle" ? 8 : 15), dividend = divisor * answer;
      return q(`${dividend} ÷ ${divisor} = ?`, answer, `${dividend}を${divisor}こずつに わけると ${answer}。`, `${dividend} divided by ${divisor} equals ${answer}.`);
    },
    unitFraction(random) {
      const denominator = pick(random, [2, 3, 4, 5, 6, 8, 10]), numerator = int(random, 1, denominator - 1);
      return q(`${numerator} / ${denominator}`, numerator, `分子は上の数 ${numerator}。`, `The numerator is ${numerator}.`, "上の かず（ぶんし）は いくつ？", "What is the numerator?");
    },
    perimeter(random, difficulty) {
      const width = int(random, 2, difficulty === "challenge" ? 20 : 12), height = int(random, 2, 12), answer = 2 * (width + height);
      return q(`2 × (${width} + ${height}) = ?`, answer, `まわりの長さは ${answer} cm。`, `The perimeter is ${answer} cm.`, `たて${height}cm、よこ${width}cmの長方形。まわりは何cm？`, `A rectangle is ${height} cm by ${width} cm. What is its perimeter?`);
    },
    addLarge(random, difficulty) {
      const max = difficulty === "gentle" ? 3000 : difficulty === "challenge" ? 99999 : 9999, a = int(random, 500, max), b = int(random, 200, max);
      return q(`${a} + ${b} = ?`, a + b, `こたえは ${a + b}。`, `The answer is ${a + b}.`);
    },
    subLarge(random, difficulty) {
      const max = difficulty === "challenge" ? 99999 : 9999, a = int(random, 1000, max), b = int(random, 200, a);
      return q(`${a} − ${b} = ?`, a - b, `こたえは ${a - b}。`, `The answer is ${a - b}.`);
    },
    multiply2x2(random, difficulty) {
      const a = int(random, 11, difficulty === "challenge" ? 99 : 49), b = int(random, 11, difficulty === "gentle" ? 25 : 59);
      return q(`${a} × ${b} = ?`, a * b, `こたえは ${a * b}。`, `The answer is ${a * b}.`);
    },
    decimalAdd(random, difficulty) {
      const places = difficulty === "challenge" ? 100 : 10, a = int(random, 2, 100) / places, b = int(random, 2, 100) / places, answer = whole(a + b);
      return q(`${whole(a)} + ${whole(b)} = ?`, answer, `小数点をそろえると ${answer}。`, `Line up the decimal points to get ${answer}.`);
    },
    decimalSub(random, difficulty) {
      const places = difficulty === "challenge" ? 100 : 10, b = int(random, 1, 50) / places, answer = int(random, 1, 70) / places, a = b + answer;
      return q(`${whole(a)} − ${whole(b)} = ?`, whole(answer), `小数点をそろえると ${whole(answer)}。`, `Line up the decimal points to get ${whole(answer)}.`);
    },
    fractionSame(random, difficulty) {
      const d = pick(random, difficulty === "challenge" ? [6, 8, 10, 12] : [3, 4, 5, 6, 8]), a = int(random, 1, d - 2), b = int(random, 1, d - a), subtract = random() < .35;
      if (subtract) {
        const high = Math.max(a, b), low = Math.min(a, b), answer = fraction(high - low, d);
        return q(`${high}/${d} − ${low}/${d} = ?`, answer, `分母はそのまま。こたえは ${answer}。`, `Keep the denominator. The answer is ${answer}.`);
      }
      const answer = fraction(a + b, d);
      return q(`${a}/${d} + ${b}/${d} = ?`, answer, `分母はそのまま。こたえは ${answer}。`, `Keep the denominator. The answer is ${answer}.`);
    },
    rectangleArea(random, difficulty) {
      const w = int(random, 3, difficulty === "challenge" ? 30 : 15), h = int(random, 2, 12), answer = w * h;
      return q(`${w} × ${h} = ?`, answer, `面積は ${answer} cm²。`, `The area is ${answer} cm².`, `たて${h}cm、よこ${w}cmの長方形。面積は何cm²？`, `A rectangle is ${h} cm by ${w} cm. What is its area?`);
    },
    decimalMultiply(random, difficulty) {
      const a = int(random, 2, difficulty === "challenge" ? 99 : 40) / 10, b = int(random, 2, difficulty === "gentle" ? 5 : 12), answer = whole(a * b);
      return q(`${whole(a)} × ${b} = ?`, answer, `こたえは ${answer}。`, `The answer is ${answer}.`);
    },
    decimalDivide(random, difficulty) {
      const divisor = int(random, 2, difficulty === "challenge" ? 12 : 8), answer = int(random, 2, 30) / 10, dividend = whole(divisor * answer);
      return q(`${dividend} ÷ ${divisor} = ?`, whole(answer), `こたえは ${whole(answer)}。`, `The answer is ${whole(answer)}.`);
    },
    fractionUnlike(random, difficulty) {
      const d1 = pick(random, [2, 3, 4, 5]), d2 = pick(random, difficulty === "challenge" ? [3, 4, 5, 6, 8] : [2, 3, 4, 6]);
      const n1 = int(random, 1, d1 - 1), n2 = int(random, 1, d2 - 1), answer = fraction(n1 * d2 + n2 * d1, d1 * d2);
      return q(`${n1}/${d1} + ${n2}/${d2} = ?`, answer, `通分して たすと ${answer}。`, `Use a common denominator. The answer is ${answer}.`);
    },
    percentOf(random, difficulty) {
      const percent = pick(random, difficulty === "challenge" ? [12, 15, 20, 25, 30, 40, 60, 75] : [10, 20, 25, 50, 75]), baseUnit = percent === 12 ? 25 : 20, base = int(random, 1, 8) * baseUnit, answer = whole(base * percent / 100);
      return q(`${percent}% × ${base} = ?`, answer, `${base}の${percent}%は ${answer}。`, `${percent}% of ${base} is ${answer}.`);
    },
    triangleArea(random, difficulty) {
      const base = int(random, 2, difficulty === "challenge" ? 30 : 16) * 2, height = int(random, 2, 14), answer = base * height / 2;
      return q(`${base} × ${height} ÷ 2 = ?`, answer, `三角形の面積は ${answer} cm²。`, `The triangle's area is ${answer} cm².`, `底辺${base}cm、高さ${height}cmの三角形。面積は？`, `A triangle has base ${base} cm and height ${height} cm. What is its area?`);
    },
    volume(random, difficulty) {
      const a = int(random, 2, difficulty === "challenge" ? 15 : 9), b = int(random, 2, 9), c = int(random, 2, 8), answer = a * b * c;
      return q(`${a} × ${b} × ${c} = ?`, answer, `体積は ${answer} cm³。`, `The volume is ${answer} cm³.`, `${a}cm × ${b}cm × ${c}cmの はこ。体積は？`, `A box is ${a} × ${b} × ${c} cm. What is its volume?`);
    },
    average(random, difficulty) {
      const count = difficulty === "challenge" ? 5 : 4, average = int(random, 3, 20), values = [];
      let sum = 0;
      for (let i = 0; i < count - 1; i += 1) { const value = int(random, 1, average * 2); values.push(value); sum += value; }
      values.push(average * count - sum);
      if (values.at(-1) < 0) return generators.average(random, difficulty);
      return q(`(${values.join(" + ")}) ÷ ${count} = ?`, average, `合計を${count}でわると 平均は${average}。`, `Divide the total by ${count}. The mean is ${average}.`);
    },
    fractionMultiply(random, difficulty) {
      const d1 = int(random, 2, difficulty === "challenge" ? 10 : 7), d2 = int(random, 2, 8), n1 = int(random, 1, d1 - 1), n2 = int(random, 1, d2 - 1), answer = fraction(n1 * n2, d1 * d2);
      return q(`${n1}/${d1} × ${n2}/${d2} = ?`, answer, `分子どうし、分母どうしをかけて ${answer}。`, `Multiply numerators and denominators to get ${answer}.`);
    },
    fractionDivide(random, difficulty) {
      const d1 = int(random, 2, difficulty === "challenge" ? 10 : 7), d2 = int(random, 2, 8), n1 = int(random, 1, d1 - 1), n2 = int(random, 1, d2 - 1), answer = fraction(n1 * d2, d1 * n2);
      return q(`${n1}/${d1} ÷ ${n2}/${d2} = ?`, answer, `2つめの分数をひっくり返してかけると ${answer}。`, `Multiply by the reciprocal to get ${answer}.`);
    },
    ratio(random, difficulty) {
      const unit = int(random, 2, difficulty === "challenge" ? 15 : 9), a = int(random, 2, 8), b = int(random, 2, 8), left = unit * a, right = unit * b;
      return q(`${left} : ${right} = ${a} : □`, b, `どちらも${unit}でわると ${a}:${b}。`, `Divide both parts by ${unit} to get ${a}:${b}.`);
    },
    percentChange(random, difficulty) {
      const original = int(random, 2, difficulty === "challenge" ? 20 : 10) * 20, percent = pick(random, [10, 20, 25, 50]), increase = random() < .5, answer = whole(original * (increase ? 1 + percent / 100 : 1 - percent / 100));
      return q(`${original} ${increase ? "+" : "−"} ${percent}% = ?`, answer, `${increase ? "ふえた" : "へった"}あとは ${answer}。`, `After the ${percent}% ${increase ? "increase" : "decrease"}, the value is ${answer}.`);
    },
    algebra(random, difficulty) {
      const x = int(random, 2, difficulty === "challenge" ? 40 : 20), a = int(random, 2, 15), multiply = random() < .45;
      if (multiply) return q(`${a} × x = ${a * x}`, x, `両方を${a}でわると x = ${x}。`, `Divide both sides by ${a}, so x = ${x}.`);
      const total = x + a;
      return q(`x + ${a} = ${total}`, x, `${total}から${a}をひくと x = ${x}。`, `Subtract ${a} from ${total}, so x = ${x}.`);
    },
    speed(random, difficulty) {
      const speed = int(random, 3, difficulty === "challenge" ? 25 : 12) * 5, hours = int(random, 2, 5), answer = speed * hours;
      return q(`${speed} × ${hours} = ?`, answer, `道のりは ${answer} km。`, `The distance is ${answer} km.`, `時速${speed}kmで${hours}時間。何kmすすむ？`, `Travel at ${speed} km/h for ${hours} hours. How far?`);
    },
    circle(random, difficulty) {
      const diameter = int(random, 2, difficulty === "challenge" ? 20 : 10) * 2, answer = whole(diameter * 3.14);
      return q(`${diameter} × 3.14 = ?`, answer, `円周は ${answer} cm。`, `The circumference is ${answer} cm.`, `直径${diameter}cmの円。円周は何cm？`, `A circle has diameter ${diameter} cm. What is its circumference?`);
    }
  };

  const unit = (id, ja, en, descJa, descEn, keys) => ({ id, ja, en, descJa, descEn, keys: Array.isArray(keys) ? keys : [keys] });
  const grades = {
    1: { ja: "1年生", en: "Grade 1", descriptionJa: "たしざん・ひきざん・かずの きほんを れんしゅうしよう。", descriptionEn: "Build number sense and learn early addition and subtraction.", units: [
      unit("g1-add10", "10までの たしざん", "Add within 10", "小さいかずを あわせよう", "Put small numbers together", "add10"),
      unit("g1-sub10", "10までの ひきざん", "Subtract within 10", "のこりを かぞえよう", "Find how many remain", "sub10"),
      unit("g1-add20", "20までの たしざん", "Add within 20", "10をこえる たしざん", "Addition across ten", "add20"),
      unit("g1-sub20", "20までの ひきざん", "Subtract within 20", "20までの ひきざん", "Subtraction within twenty", "sub20"),
      unit("g1-missing", "□に はいる かず", "Missing numbers", "かくれた かずを みつけよう", "Find the hidden number", "missing"),
      unit("g1-greater", "大きい かず", "Greater numbers", "どちらが 大きい？", "Which number is greater?", "greater"),
      unit("g1-tens", "10の まとまり", "Tens and ones", "10と1に わけてみよう", "Build numbers with tens and ones", "tens"),
      unit("g1-mix", "1年生 ミックス", "Grade 1 mix", "ぜんぶを まぜて チャレンジ", "A mixed Grade 1 challenge", ["add10", "sub10", "add20", "sub20", "missing", "greater", "tens"])
    ]},
    2: { ja: "2年生", en: "Grade 2", descriptionJa: "100までの計算と かけ算九九を つよくしよう。", descriptionEn: "Practice two-digit arithmetic and multiplication tables.", units: [
      unit("g2-add", "2けたの たしざん", "Two-digit addition", "100までの たしざん", "Add numbers up to 100", "add100"),
      unit("g2-sub", "2けたの ひきざん", "Two-digit subtraction", "100までの ひきざん", "Subtract numbers up to 100", "sub100"),
      unit("g2-2510", "2・5・10のだん", "2, 5 and 10 times", "九九を おぼえよう", "Build multiplication facts", "timesEasy"),
      unit("g2-34", "3・4のだん", "3 and 4 times", "3と4の九九", "The 3 and 4 times tables", "times34"),
      unit("g2-67", "6・7のだん", "6 and 7 times", "6と7の九九", "The 6 and 7 times tables", "times67"),
      unit("g2-89", "8・9のだん", "8 and 9 times", "8と9の九九", "The 8 and 9 times tables", "times89"),
      unit("g2-money", "おかね", "Money", "円の たしざん", "Add prices in yen", "money"),
      unit("g2-mix", "2年生 ミックス", "Grade 2 mix", "計算と九九のチャレンジ", "Mixed arithmetic and times tables", ["add100", "sub100", "timesEasy", "times34", "times67", "times89", "money"])
    ]},
    3: { ja: "3年生", en: "Grade 3", descriptionJa: "大きい数、かけ算、わり算、分数、長さを学ぼう。", descriptionEn: "Work with larger numbers, division, fractions and perimeter.", units: [
      unit("g3-add", "3けたの たしざん", "Three-digit addition", "1000までの たしざん", "Add numbers up to 1,000", "add1000"),
      unit("g3-sub", "3けたの ひきざん", "Three-digit subtraction", "1000までの ひきざん", "Subtract numbers up to 1,000", "sub1000"),
      unit("g3-multiply", "2けた × 1けた", "Multiply by one digit", "大きい かけ算", "Larger multiplication", "multiply2x1"),
      unit("g3-divide", "わり算", "Division", "ぴったり わけよう", "Share into equal groups", "divideExact"),
      unit("g3-tables", "九九 マスター", "Times-table master", "2から9の九九", "All multiplication tables", ["timesEasy", "times34", "times67", "times89"]),
      unit("g3-fraction", "分数の きほん", "Fraction basics", "分子と分母を みよう", "Read simple fractions", "unitFraction"),
      unit("g3-perimeter", "まわりの 長さ", "Perimeter", "長方形の まわり", "Perimeter of rectangles", "perimeter"),
      unit("g3-mix", "3年生 ミックス", "Grade 3 mix", "3年生の まとめ", "A mixed Grade 3 review", ["add1000", "sub1000", "multiply2x1", "divideExact", "unitFraction", "perimeter"])
    ]},
    4: { ja: "4年生", en: "Grade 4", descriptionJa: "大きい計算、小数、分数、面積にチャレンジ。", descriptionEn: "Tackle large arithmetic, decimals, fractions and area.", units: [
      unit("g4-add", "大きい たしざん", "Large addition", "4けた以上の たしざん", "Add large numbers", "addLarge"),
      unit("g4-sub", "大きい ひきざん", "Large subtraction", "4けた以上の ひきざん", "Subtract large numbers", "subLarge"),
      unit("g4-multiply", "2けた × 2けた", "Two-digit multiplication", "ひっ算で かけよう", "Multiply two-digit numbers", "multiply2x2"),
      unit("g4-divide", "大きい わり算", "Larger division", "わり算を つよくしよう", "Practice exact division", "divideExact"),
      unit("g4-decimal-add", "小数の たしざん", "Decimal addition", "小数点を そろえよう", "Line up decimal points", "decimalAdd"),
      unit("g4-decimal-sub", "小数の ひきざん", "Decimal subtraction", "小数を ひこう", "Subtract decimals", "decimalSub"),
      unit("g4-fraction", "分数の たしひき", "Fraction addition", "同じ分母の 分数", "Fractions with like denominators", "fractionSame"),
      unit("g4-area", "長方形の 面積", "Rectangle area", "たて × よこ", "Length times width", "rectangleArea")
    ]},
    5: { ja: "5年生", en: "Grade 5", descriptionJa: "小数、分数、割合、面積、体積、平均を学ぼう。", descriptionEn: "Practice decimals, fractions, percentages, geometry and averages.", units: [
      unit("g5-decimal-mul", "小数の かけ算", "Decimal multiplication", "小数を かけよう", "Multiply decimals", "decimalMultiply"),
      unit("g5-decimal-div", "小数の わり算", "Decimal division", "小数を わろう", "Divide decimals", "decimalDivide"),
      unit("g5-fraction", "分数の たし算", "Unlike fractions", "通分して たそう", "Add unlike fractions", "fractionUnlike"),
      unit("g5-percent", "百分率", "Percent of a number", "何%かを もとめよう", "Find a percentage", "percentOf"),
      unit("g5-triangle", "三角形の 面積", "Triangle area", "底辺 × 高さ ÷ 2", "Base times height divided by two", "triangleArea"),
      unit("g5-volume", "直方体の 体積", "Box volume", "たて × よこ × 高さ", "Length times width times height", "volume"),
      unit("g5-average", "平均", "Averages", "合計を 個数で わろう", "Divide the total by the count", "average"),
      unit("g5-mix", "5年生 ミックス", "Grade 5 mix", "5年生の まとめ", "A mixed Grade 5 review", ["decimalMultiply", "decimalDivide", "fractionUnlike", "percentOf", "triangleArea", "volume", "average"])
    ]},
    6: { ja: "6年生", en: "Grade 6", descriptionJa: "分数、比、割合、文字、速さ、円をマスターしよう。", descriptionEn: "Master fractions, ratios, percentages, algebra, speed and circles.", units: [
      unit("g6-frac-mul", "分数の かけ算", "Multiply fractions", "分子と分母を かけよう", "Multiply fractions", "fractionMultiply"),
      unit("g6-frac-div", "分数の わり算", "Divide fractions", "逆数を かけよう", "Multiply by the reciprocal", "fractionDivide"),
      unit("g6-ratio", "比", "Ratios", "同じ比を みつけよう", "Find equivalent ratios", "ratio"),
      unit("g6-percent", "割合の 変化", "Percent change", "ふえる・へる割合", "Percentage increase and decrease", "percentChange"),
      unit("g6-algebra", "文字と 式", "Simple algebra", "xを みつけよう", "Solve for x", "algebra"),
      unit("g6-speed", "速さと 道のり", "Speed and distance", "速さ × 時間", "Speed times time", "speed"),
      unit("g6-circle", "円周", "Circumference", "直径 × 3.14", "Diameter times 3.14", "circle"),
      unit("g6-mix", "6年生 ミックス", "Grade 6 mix", "小学校算数の まとめ", "A complete elementary review", ["fractionMultiply", "fractionDivide", "ratio", "percentChange", "algebra", "speed", "circle", "average"])
    ]}
  };

  function generate(unitData, random = Math.random, difficulty = "normal") {
    const key = pick(random, unitData.keys);
    return generators[key](random, difficulty);
  }

  window.MATH_CUP_DATA = { grades, generate, whole, fraction };
})();
